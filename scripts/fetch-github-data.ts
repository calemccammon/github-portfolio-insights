#!/usr/bin/env tsx
/**
 * Fetch GitHub data for calemccammon using the GitHub CLI (`gh api`) and merge
 * in the hand-written page content. Writes public/data/github-stats.json for
 * Vite to bundle.
 *
 * Local / CI: requires only the GitHub CLI (`gh auth login`, or GITHUB_TOKEN
 * in Actions).
 *
 * The introduction, featured project write-ups and per-repo tags live in
 * src/data/content.json, and src/data/README.md is the guide for writing them.
 * They are committed, not generated at build time: they change only when the
 * repositories do, which is far less often than this script runs.
 *
 * Usage: npx tsx scripts/fetch-github-data.ts
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  GitHubProfile, GitHubRepo, RepoLanguages, GitHubStats, PageContent, PortfolioContent,
} from '../src/types/github.ts';
import { contentProblems } from '../src/utils/content.ts';

const USERNAME = 'calemccammon';

function gh(endpoint: string): unknown {
  const out = execSync(`gh api "${endpoint}"`, { encoding: 'utf8' });
  return JSON.parse(out);
}

/**
 * Reads the committed page content. A missing or unparseable file degrades to
 * null rather than failing the build -- the dashboard renders without the
 * hand-written sections instead of the deploy going red. Rule violations are
 * only warned about here; the test suite is what blocks a bad edit.
 */
function readContent(): PortfolioContent | null {
  const path = join(import.meta.dirname ?? process.cwd(), '..', 'src', 'data', 'content.json');
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<PortfolioContent>;
    for (const problem of contentProblems(parsed)) console.warn(`Warning: content.json: ${problem}`);
    return {
      name: parsed.name,
      intro: parsed.intro ?? '',
      featured: parsed.featured ?? [],
      tagGroups: parsed.tagGroups ?? [],
      techTags: parsed.techTags ?? {},
    };
  } catch (err) {
    console.warn('Warning: page content unavailable:', (err as Error).message);
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
    console.warn(`Note: no tags in content.json for ${untagged.length} repo(s): ${untagged.join(', ')}`);
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
const repoLanguages: Record<string, RepoLanguages> = {};
for (const repo of ownRepos) {
  try {
    const repoLangs = gh(`/repos/${USERNAME}/${repo.name}/languages`) as RepoLanguages;
    repoLanguages[repo.name] = repoLangs;
    for (const [lang, bytes] of Object.entries(repoLangs)) {
      aggregatedLanguages[lang] = (aggregatedLanguages[lang] ?? 0) + bytes;
    }
  } catch {
    // repo may have no languages (empty repo) -- skip
  }
}

console.log('Reading committed page content...');
const committed = readContent();
const techTags = committed ? tagsForLiveRepos(committed.techTags, ownRepos) : null;
if (techTags) console.log(`Tags matched for ${Object.keys(techTags).length} repos`);

let content: PageContent | null = null;
if (committed) {
  const live = new Set(ownRepos.map((r) => r.name));
  const missing = committed.featured.filter((f) => !live.has(f.repo)).map((f) => f.repo);
  if (missing.length > 0) {
    console.warn(`Note: featured repo(s) not found on GitHub and left out: ${missing.join(', ')}`);
  }
  content = {
    name: committed.name,
    intro: committed.intro,
    featured: committed.featured.filter((f) => live.has(f.repo)),
    tagGroups: committed.tagGroups,
  };
}

const stats: GitHubStats = {
  profile,
  repos: ownRepos,
  languages: aggregatedLanguages,
  repoLanguages,
  content,
  techTags,
  fetchedAt: new Date().toISOString(),
};

const outDir = join(import.meta.dirname ?? process.cwd(), '..', 'public', 'data');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'github-stats.json');
writeFileSync(outPath, JSON.stringify(stats, null, 2));
console.log(`Written to ${outPath}`);