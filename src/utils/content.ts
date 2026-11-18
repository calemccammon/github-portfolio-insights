import type { PortfolioContent } from "../types/github";

const MAX_INTRO_WORDS = 80;
const MIN_FEATURED = 4;
const MAX_FEATURED = 6;
const MIN_POINTS = 2;
const MAX_POINTS = 3;

/**
 * Checks the structural rules that src/data/README.md sets for content.json and
 * returns one message per broken rule. It runs in the test suite, so a bad edit
 * fails before deploy, and in the fetch script, where it only warns.
 *
 * `raw` is unknown on purpose: the file is edited by hand, so nothing about its
 * shape can be assumed.
 */
export function contentProblems(raw: unknown): string[] {
  const problems: string[] = [];
  const c = (raw ?? {}) as Partial<PortfolioContent>;

  if (typeof c.intro !== "string" || !c.intro.trim()) {
    problems.push("intro is missing");
  } else if (c.intro.trim().split(/\s+/).length > MAX_INTRO_WORDS) {
    problems.push(`intro is over ${MAX_INTRO_WORDS} words`);
  }

  const techTags = c.techTags && typeof c.techTags === "object" ? c.techTags : null;
  if (!techTags) problems.push("techTags is missing");

  const used = new Set<string>();
  for (const [repo, tags] of Object.entries(techTags ?? {})) {
    if (!Array.isArray(tags) || tags.length === 0) {
      problems.push(`${repo}: has no tags`);
      continue;
    }
    if (new Set(tags).size !== tags.length) problems.push(`${repo}: repeats a tag`);
    for (const tag of tags) {
      // Tags are comma-joined in the query string, so a comma would split one tag in two.
      if (tag.includes(",")) problems.push(`${repo}: tag "${tag}" contains a comma`);
      used.add(tag);
    }
  }

  const groups = Array.isArray(c.tagGroups) ? c.tagGroups : null;
  if (!groups) problems.push("tagGroups is missing");

  const grouped = new Map<string, string>();
  for (const group of groups ?? []) {
    for (const tag of group.tags ?? []) {
      const earlier = grouped.get(tag);
      if (earlier) problems.push(`tag "${tag}" is in two groups: ${earlier} and ${group.label}`);
      grouped.set(tag, group.label);
      if (techTags && !used.has(tag)) {
        problems.push(`tag "${tag}" in group ${group.label} is not used by any repository`);
      }
    }
  }
  if (groups) {
    for (const tag of used) {
      if (!grouped.has(tag)) problems.push(`tag "${tag}" is not in any group`);
    }
  }

  const featured = Array.isArray(c.featured) ? c.featured : null;
  if (!featured) {
    problems.push("featured is missing");
  } else if (featured.length < MIN_FEATURED || featured.length > MAX_FEATURED) {
    problems.push(`featured has ${featured.length} projects; expected ${MIN_FEATURED} to ${MAX_FEATURED}`);
  }

  const seen = new Set<string>();
  for (const project of featured ?? []) {
    const name = project.repo || "(unnamed featured project)";
    if (seen.has(name)) problems.push(`${name}: featured twice`);
    seen.add(name);
    if (!project.summary?.trim()) problems.push(`${name}: summary is missing`);

    const points = project.points ?? [];
    if (points.length < MIN_POINTS || points.length > MAX_POINTS) {
      problems.push(`${name}: has ${points.length} points; expected ${MIN_POINTS} to ${MAX_POINTS}`);
    }
    if (techTags && !techTags[name]) problems.push(`${name}: featured but has no techTags entry`);

    for (const link of project.links ?? []) {
      if (!link.label?.trim()) problems.push(`${name}: a link has no label`);
      if (!/^https:\/\//.test(link.url ?? "")) problems.push(`${name}: link "${link.label}" is not an https URL`);
    }
  }

  return problems;
}

export interface TagUsage {
  count: Record<string, number>;
  repos: Record<string, string[]>;
}

/** How many repositories use each tag, and which ones. */
export function tagUsage(techTags: Record<string, string[]>): TagUsage {
  const count: Record<string, number> = {};
  const repos: Record<string, string[]> = {};
  for (const [repo, tags] of Object.entries(techTags)) {
    for (const tag of tags) {
      count[tag] = (count[tag] ?? 0) + 1;
      repos[tag] = [...(repos[tag] ?? []), repo];
    }
  }
  return { count, repos };
}
