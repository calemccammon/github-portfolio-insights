import type { GitHubRepo } from "../types/github";

export type SortKey = "recent" | "stars" | "name";

export const SORT_KEYS: SortKey[] = ["recent", "stars", "name"];

export const SORT_LABELS: Record<SortKey, string> = {
  recent: "Recently pushed",
  stars: "Most stars",
  name: "Name (A–Z)",
};

export interface RepoFilters {
  search: string;
  topics: string[];
  tags: string[];
  languages: string[];
  sort: SortKey;
}

export const DEFAULT_FILTERS: RepoFilters = {
  search: "",
  topics: [],
  tags: [],
  languages: [],
  sort: "recent",
};

/** Sort is a view preference, not a filter -- it never narrows the result set. */
export function hasActiveFilters(f: RepoFilters): boolean {
  return (
    f.search.trim() !== "" ||
    f.topics.length > 0 ||
    f.tags.length > 0 ||
    f.languages.length > 0
  );
}

export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * Topics and tags combine with AND, so each chip clicked narrows the results --
 * that is what makes them read as filters rather than as a search. Languages
 * combine with OR instead, because a repo has exactly one primary language and
 * ANDing two of them could only ever return nothing.
 */
export function filterRepos(
  repos: GitHubRepo[],
  filters: RepoFilters,
  aiTechTags: Record<string, string[]> | null,
): GitHubRepo[] {
  const needle = filters.search.trim().toLowerCase();

  return repos.filter((repo) => {
    if (needle) {
      const haystack = `${repo.name} ${repo.description ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (!filters.topics.every((t) => repo.topics.includes(t))) return false;

    const tags = aiTechTags?.[repo.name] ?? [];
    if (!filters.tags.every((t) => tags.includes(t))) return false;

    if (filters.languages.length > 0 && !filters.languages.includes(repo.language ?? "")) {
      return false;
    }
    return true;
  });
}

export function sortRepos(repos: GitHubRepo[], sort: SortKey): GitHubRepo[] {
  const byRecency = (a: GitHubRepo, b: GitHubRepo) =>
    new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();

  const copy = [...repos];
  switch (sort) {
    case "stars":
      // Nearly every repo here has zero stars, so an unbroken tie would leave
      // the order down to whatever the API returned. Fall back to recency.
      return copy.sort((a, b) => b.stargazers_count - a.stargazers_count || byRecency(a, b));
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return copy.sort(byRecency);
  }
}

/** Primary languages present across the repos, most-used first. */
export function availableLanguages(repos: GitHubRepo[]): string[] {
  const count: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) count[repo.language] = (count[repo.language] ?? 0) + 1;
  }
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name);
}

/** Repos per primary language -- the counterweight lens to raw byte counts. */
export function repoCountsByLanguage(repos: GitHubRepo[]): Record<string, number> {
  const count: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) count[repo.language] = (count[repo.language] ?? 0) + 1;
  }
  return count;
}

/**
 * Multi-value params are comma-joined. No GitHub topic may contain a comma, and
 * the committed tech tags are checked against the same rule, so the separator
 * cannot collide with a value.
 */
const SEP = ",";

export function filtersToSearchParams(f: RepoFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.search.trim()) params.set("q", f.search.trim());
  if (f.topics.length) params.set("topic", f.topics.join(SEP));
  if (f.tags.length) params.set("tag", f.tags.join(SEP));
  if (f.languages.length) params.set("lang", f.languages.join(SEP));
  // Omitted when default, so an unfiltered view stays a clean, shareable URL.
  if (f.sort !== "recent") params.set("sort", f.sort);
  return params;
}

export function filtersFromSearchParams(params: URLSearchParams): RepoFilters {
  const list = (key: string) =>
    (params.get(key) ?? "")
      .split(SEP)
      .map((s) => s.trim())
      .filter(Boolean);

  const sort = params.get("sort");
  return {
    search: params.get("q") ?? "",
    topics: list("topic"),
    tags: list("tag"),
    languages: list("lang"),
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : "recent",
  };
}
