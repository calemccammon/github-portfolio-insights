#!/usr/bin/env tsx
/**
 * Fetch GitHub data for calemccammon using the GitHub CLI (`gh api`).
 * Calls GitHub Models (gpt-4o-mini) to generate an AI portfolio narrative.
 * Writes public/data/github-stats.json for the Vite build to bundle.
 *
 * Local:  requires `gh auth login` as calemccammon
 * CI:     GITHUB_TOKEN is auto-provided by GitHub Actions
 *
 * Usage: npx tsx scripts/fetch-github-data.ts
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { GitHubProfile, GitHubRepo, RepoLanguages, GitHubStats } from '../src/types/github.ts';

const USERNAME = 'calemccammon';

function gh(endpoint: string): unknown {
  const out = execSync(`gh api "${endpoint}"`, { encoding: 'utf8' });
  return JSON.parse(out);
}

function getGitHubToken(): string | null {
  // CI: GitHub Actions injects GITHUB_TOKEN automatically
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  // Local: use the active gh CLI account
  try {
    return execSync('gh auth token', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

async function fetchAINarrative(repos: GitHubRepo[]): Promise<string | null> {
  const token = getGitHubToken();
  if (!token) {
    console.warn('Warning: No GitHub token available -- skipping AI narrative.');
    return null;
  }

  try {
    const repoList = repos
      .map((r) => `- ${r.name}: ${r.description ?? 'no description'} [topics: ${r.topics.join(', ') || 'none'}]`)
      .join('\n');

    const systemMessage =
      `You write encyclopedic, matter-of-fact technical prose. ` +
      `Describe only what is concretely present. No opinions, no editorial commentary, no value judgments. ` +
      `Banned words and phrases: unusual, interesting, unique, stands out, showcases, demonstrates, highlights, ` +
      `versatility, proficiency, well-rounded, reflects, suggests, leverages, robust, blend, merging, rigor, emphasis on.`;

    const prompt =
      `Here are a software engineer's GitHub repositories:\n\n${repoList}\n\n` +
      `Write exactly 2 short paragraphs, under 90 words total. ` +
      `First: what technical domains the work covers, naming the actual tools and architectures used. ` +
      `Second: the recurring patterns or repeated technology choices across repos. ` +
      `State facts only. Do not editorialize. No bullet points.`;

    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`Warning: GitHub Models call failed (${response.status}): ${body}`);
      return null;
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim() ?? null;
    if (text) console.log('AI narrative generated');
    return text;
  } catch (err) {
    console.warn('Warning: AI narrative skipped:', (err as Error).message);
    return null;
  }
}

async function fetchAITechTags(repos: GitHubRepo[], token: string | null): Promise<Record<string, string[]> | null> {
  if (!token) return null;
  try {
    const readmes: string[] = [];
    for (const repo of repos) {
      try {
        const data = gh(`/repos/${USERNAME}/${repo.name}/readme`) as { content: string };
        const text = Buffer.from(data.content, 'base64').toString('utf8').slice(0, 2000);
        readmes.push(`=== ${repo.name} ===\n${text}`);
      } catch {
        readmes.push(`=== ${repo.name} ===\n(no readme)`);
      }
    }

    const prompt =
      `Here are README files for a developer's GitHub repositories.\n\n${readmes.join('\n\n')}\n\n` +
      `For each repository, extract a list of specific technologies, frameworks, libraries, architectural patterns, and design patterns ` +
      `that are actually mentioned or clearly evident. Be specific (e.g. "Coroutines", "MVVM", "KTables", "Room", "Medallion Architecture") ` +
      `rather than generic (e.g. not "backend", "database"). Omit language names (Java, Kotlin, Python, etc.) -- those are tracked separately. ` +
      `Return ONLY valid JSON in this exact shape, no markdown, no explanation:\n` +
      `{"repo-name": ["Tag1", "Tag2"], ...}`;

    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn(`Warning: GitHub Models tech tags call failed (${response.status})`);
      return null;
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    console.log('AI tech tags extracted');
    return parsed;
  } catch (err) {
    console.warn('Warning: AI tech tags skipped:', (err as Error).message);
    return null;
  }
}

console.log('Fetching GitHub profile...');
const profile = gh(`/users/${USERNAME}`) as GitHubProfile;

console.log('Fetching repositories...');
const repos = gh(`/users/${USERNAME}/repos?per_page=100&sort=updated`) as GitHubRepo[];
const ownRepos = repos.filter((r) => !r.fork);

console.log(`Fetching languages for ${ownRepos.length} repos...`);
const aggregatedLanguages: Record<string, number> = {};
for (const repo of ownRepos) {
  try {
    const repoLangs = gh(`/repos/${USERNAME}/${repo.name}/languages`) as RepoLanguages;
    for (const [lang, bytes] of Object.entries(repoLangs)) {
      aggregatedLanguages[lang] = (aggregatedLanguages[lang] ?? 0) + bytes;
    }
  } catch {
    // repo may have no languages (empty repo) -- skip
  }
}

console.log('Calling GitHub Models for portfolio narrative...');
const aiNarrative = await fetchAINarrative(ownRepos);

console.log('Calling GitHub Models for README tech tag extraction...');
const aiTechTags = await fetchAITechTags(ownRepos, getGitHubToken());

const stats: GitHubStats = {
  profile,
  repos: ownRepos,
  languages: aggregatedLanguages,
  aiNarrative,
  aiTechTags,
  fetchedAt: new Date().toISOString(),
};

const outDir = join(import.meta.dirname ?? process.cwd(), '..', 'public', 'data');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'github-stats.json');
writeFileSync(outPath, JSON.stringify(stats, null, 2));
console.log(`Written to ${outPath}`);