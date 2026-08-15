#!/usr/bin/env tsx
/**
 * Fetch GitHub data for calemccammon using the GitHub CLI (`gh api`).
 * Calls the Claude API to generate an AI portfolio narrative and per-repo
 * technology tags. Writes public/data/github-stats.json for Vite to bundle.
 *
 * Local:  requires `gh auth login` as calemccammon, plus ANTHROPIC_API_KEY
 * CI:     gh uses GITHUB_TOKEN; ANTHROPIC_API_KEY comes from repo secrets
 *
 * Both AI sections degrade to null if the key is absent or the call fails --
 * the dashboard renders without them rather than failing the build.
 *
 * Usage: npx tsx scripts/fetch-github-data.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { GitHubProfile, GitHubRepo, RepoLanguages, GitHubStats } from '../src/types/github.ts';

const USERNAME = 'calemccammon';

/**
 * This previously called GitHub Models, which was retired -- the endpoint now
 * answers 410 `github_models_retirement_brownout`, so both AI sections had been
 * silently rendering empty.
 */
const MODEL = 'claude-opus-5';

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

function gh(endpoint: string): unknown {
  const out = execSync(`gh api "${endpoint}"`, { encoding: 'utf8' });
  return JSON.parse(out);
}

/** Turns an SDK error into one readable line, using its typed class. */
function describe(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return 'invalid or missing ANTHROPIC_API_KEY';
  if (err instanceof Anthropic.RateLimitError) return 'rate limited';
  if (err instanceof Anthropic.APIError) return `API error ${err.status}: ${err.message}`;
  return (err as Error).message;
}

async function fetchAINarrative(repos: GitHubRepo[]): Promise<string | null> {
  if (!anthropic) {
    console.warn('Warning: ANTHROPIC_API_KEY not set -- skipping AI narrative.');
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

    const response = await anthropic.messages.create({
      model: MODEL,
      // Generous, because max_tokens caps thinking plus response text together.
      max_tokens: 16000,
      system: systemMessage,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    if (!text) {
      console.warn(`Warning: AI narrative empty (stop_reason: ${response.stop_reason})`);
      return null;
    }

    console.log('AI narrative generated');
    return text;
  } catch (err) {
    console.warn('Warning: AI narrative skipped:', describe(err));
    return null;
  }
}

/**
 * The UI wants `{ "repo-name": ["Tag"] }`, but a schema with arbitrary keys
 * cannot be expressed -- structured outputs require `additionalProperties:
 * false`. So the model returns a list of named entries and we reshape it here.
 */
const TECH_TAGS_SCHEMA = {
  type: 'object',
  properties: {
    repositories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The repository name, exactly as given.' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'tags'],
        additionalProperties: false,
      },
    },
  },
  required: ['repositories'],
  additionalProperties: false,
} as const;

async function fetchAITechTags(repos: GitHubRepo[]): Promise<Record<string, string[]> | null> {
  if (!anthropic) return null;
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
      `Include one entry per repository, using its exact name.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // Reading twenty READMEs and deciding what counts as a specific,
      // non-generic technology is worth thinking about.
      thinking: { type: 'adaptive' },
      // The schema is enforced server-side, so no parse-and-retry loop.
      output_config: { format: { type: 'json_schema', schema: TECH_TAGS_SCHEMA } },
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    if (!raw) {
      console.warn(`Warning: AI tech tags empty (stop_reason: ${response.stop_reason})`);
      return null;
    }

    const parsed = JSON.parse(raw) as { repositories: Array<{ name: string; tags: string[] }> };
    const byRepo: Record<string, string[]> = {};
    for (const entry of parsed.repositories) {
      if (entry.tags.length > 0) byRepo[entry.name] = entry.tags;
    }

    console.log(`AI tech tags extracted for ${Object.keys(byRepo).length} repos`);
    return byRepo;
  } catch (err) {
    console.warn('Warning: AI tech tags skipped:', describe(err));
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

console.log('Calling Claude for portfolio narrative...');
const aiNarrative = await fetchAINarrative(ownRepos);

console.log('Calling Claude for README tech tag extraction...');
const aiTechTags = await fetchAITechTags(ownRepos);

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