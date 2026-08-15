#!/usr/bin/env tsx
/**
 * Fetch GitHub data for calemccammon using the GitHub CLI (`gh api`) and merge
 * in the committed AI-authored content. Writes public/data/github-stats.json
 * for Vite to bundle.
 *
 * Local / CI: requires only the GitHub CLI (`gh auth login`, or GITHUB_TOKEN
 * in Actions). No model provider, no API key, no per-build inference cost.
 *
 * The narrative and per-repo tech tags live in src/data/ai-content.json. They
 * were written by Claude with the repository list, descriptions, topics and
 * READMEs in context, then reviewed and committed -- they are not generated at
 * build time. They only need refreshing when the portfolio itself changes,
 * which is far less often than this script runs.
 *
 * Usage: npx tsx scripts/fetch-github-data.ts
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GitHubProfile, GitHubRepo, RepoLanguages, GitHubStats } from '../src/types/github.ts';

const USERNAME = 'calemccammon';

function gh(endpoint: string): unknown {
  const out = execSync(`gh api "${endpoint}"`, { encoding: 'utf8' });
  return JSON.parse(out);
}

interface AIContent {
  narrative: string;
  techTags: Record<string, string[]>;
}

/**
 * Reads the committed AI content. A missing or malformed file degrades to
 * empty rather than failing the build -- the dashboard renders without those
 * two sections instead of the deploy going red.
 */
function readAIContent(): AIContent | null {
  const path = join(import.meta.dirname ?? process.cwd(), '..', 'src', 'data', 'ai-content.json');
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<AIContent>;
    if (!parsed.narrative || !parsed.techTags) throw new Error('missing narrative or techTags');
    return { narrative: parsed.narrative, techTags: parsed.techTags };
  } catch (err) {
    console.warn('Warning: AI content unavailable:', (err as Error).message);
    return null;
  }
}

/**
 * Drops entries for repos that no longer exist, so a renamed or deleted repo
 * cannot leave a stale tag list behind in the published JSON.
 */
function tagsForLiveRepos(
  techTags: Record<string, string[]>,
  repos: GitHubRepo[],
): Record<string, string[]> {
  const live = new Set(repos.map((r) => r.name));
  const matched: Record<string, string[]> = {};
  for (const [name, tags] of Object.entries(techTags)) {
    if (live.has(name) && tags.length > 0) matched[name] = tags;
  }

  const untagged = repos.filter((r) => !matched[r.name]).map((r) => r.name);
  if (untagged.length > 0) {
    console.warn(`Note: no committed tech tags for ${untagged.length} repo(s): ${untagged.join(', ')}`);
  }
  return matched;
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

console.log('Reading committed AI content...');
const aiContent = readAIContent();
const aiNarrative = aiContent?.narrative ?? null;
const aiTechTags = aiContent ? tagsForLiveRepos(aiContent.techTags, ownRepos) : null;
if (aiTechTags) console.log(`AI tech tags matched for ${Object.keys(aiTechTags).length} repos`);

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