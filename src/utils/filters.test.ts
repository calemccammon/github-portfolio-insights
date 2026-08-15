import { describe, it, expect } from 'vitest';
import type { GitHubRepo } from '../types/github';
import {
  DEFAULT_FILTERS, availableLanguages, filterRepos, filtersFromSearchParams,
  filtersToSearchParams, hasActiveFilters, repoCountsByLanguage, sortRepos, toggleValue,
} from '../utils/filters';

function repo(over: Partial<GitHubRepo> & { name: string }): GitHubRepo {
  return {
    id: over.name.length, full_name: `calemccammon/${over.name}`, description: null,
    html_url: '', language: null, stargazers_count: 0, forks_count: 0, fork: false,
    archived: false, pushed_at: '2026-01-01T00:00:00Z', created_at: '2020-01-01T00:00:00Z',
    topics: [], ...over,
  };
}

const REPOS: GitHubRepo[] = [
  repo({ name: 'alpha', language: 'Dart', topics: ['flutter', 'graphql'], description: 'Freight tracking', pushed_at: '2026-08-01T00:00:00Z', stargazers_count: 0 }),
  repo({ name: 'beta', language: 'Kotlin', topics: ['kafka', 'streaming'], description: 'Stream processing', pushed_at: '2026-07-01T00:00:00Z', stargazers_count: 5 }),
  repo({ name: 'gamma', language: 'Kotlin', topics: ['kafka'], description: 'Trivia game', pushed_at: '2026-06-01T00:00:00Z', stargazers_count: 1 }),
  repo({ name: 'delta', language: null, topics: [], description: null, pushed_at: '2026-05-01T00:00:00Z' }),
];

const TAGS = { alpha: ['Riverpod', 'ferry'], beta: ['KTables', 'Ktor'], gamma: ['KTables'] };

describe('filterRepos', () => {
  it('returns everything when no filters are active', () => {
    expect(filterRepos(REPOS, DEFAULT_FILTERS, TAGS)).toHaveLength(4);
  });

  it('matches search against name and description, case-insensitively', () => {
    const byName = filterRepos(REPOS, { ...DEFAULT_FILTERS, search: 'ALPH' }, TAGS);
    expect(byName.map((r) => r.name)).toEqual(['alpha']);

    const byDescription = filterRepos(REPOS, { ...DEFAULT_FILTERS, search: 'stream' }, TAGS);
    expect(byDescription.map((r) => r.name)).toEqual(['beta']);
  });

  it('tolerates a null description when searching', () => {
    expect(filterRepos(REPOS, { ...DEFAULT_FILTERS, search: 'delta' }, TAGS).map((r) => r.name))
      .toEqual(['delta']);
  });

  it('narrows as topics are added -- topics combine with AND', () => {
    const one = filterRepos(REPOS, { ...DEFAULT_FILTERS, topics: ['kafka'] }, TAGS);
    expect(one.map((r) => r.name)).toEqual(['beta', 'gamma']);

    const two = filterRepos(REPOS, { ...DEFAULT_FILTERS, topics: ['kafka', 'streaming'] }, TAGS);
    expect(two.map((r) => r.name)).toEqual(['beta']);
  });

  it('widens as languages are added -- languages combine with OR', () => {
    const one = filterRepos(REPOS, { ...DEFAULT_FILTERS, languages: ['Dart'] }, TAGS);
    expect(one.map((r) => r.name)).toEqual(['alpha']);

    const two = filterRepos(REPOS, { ...DEFAULT_FILTERS, languages: ['Dart', 'Kotlin'] }, TAGS);
    expect(two.map((r) => r.name)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('never matches a language-less repo against a language filter', () => {
    expect(filterRepos(REPOS, { ...DEFAULT_FILTERS, languages: ['Dart'] }, TAGS)
      .some((r) => r.name === 'delta')).toBe(false);
  });

  it('filters on tech tags, and treats a repo with no tags as non-matching', () => {
    expect(filterRepos(REPOS, { ...DEFAULT_FILTERS, tags: ['KTables'] }, TAGS).map((r) => r.name))
      .toEqual(['beta', 'gamma']);
    expect(filterRepos(REPOS, { ...DEFAULT_FILTERS, tags: ['Riverpod'] }, TAGS).map((r) => r.name))
      .toEqual(['alpha']);
  });

  it('treats every repo as untagged when aiTechTags is null', () => {
    expect(filterRepos(REPOS, { ...DEFAULT_FILTERS, tags: ['KTables'] }, null)).toHaveLength(0);
  });

  it('combines different facets with AND', () => {
    const result = filterRepos(
      REPOS, { ...DEFAULT_FILTERS, topics: ['kafka'], languages: ['Kotlin'], search: 'trivia' }, TAGS,
    );
    expect(result.map((r) => r.name)).toEqual(['gamma']);
  });

  it('can legitimately return nothing', () => {
    expect(filterRepos(REPOS, { ...DEFAULT_FILTERS, topics: ['flutter', 'kafka'] }, TAGS)).toHaveLength(0);
  });
});

describe('sortRepos', () => {
  it('sorts by most recent push by default', () => {
    expect(sortRepos(REPOS, 'recent').map((r) => r.name)).toEqual(['alpha', 'beta', 'gamma', 'delta']);
  });

  it('sorts by stars, breaking ties by recency rather than input order', () => {
    expect(sortRepos(REPOS, 'stars').map((r) => r.name)).toEqual(['beta', 'gamma', 'alpha', 'delta']);
  });

  it('sorts by name', () => {
    expect(sortRepos(REPOS, 'name').map((r) => r.name)).toEqual(['alpha', 'beta', 'delta', 'gamma']);
  });

  it('does not mutate the input array', () => {
    const original = [...REPOS];
    sortRepos(REPOS, 'name');
    expect(REPOS).toEqual(original);
  });
});

describe('language helpers', () => {
  it('lists primary languages most-used first, skipping repos with none', () => {
    expect(availableLanguages(REPOS)).toEqual(['Kotlin', 'Dart']);
  });

  it('counts repos per primary language', () => {
    expect(repoCountsByLanguage(REPOS)).toEqual({ Dart: 1, Kotlin: 2 });
  });
});

describe('hasActiveFilters', () => {
  it('is false for defaults, and for sort alone', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: 'name' })).toBe(false);
  });

  it('ignores whitespace-only search', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: '   ' })).toBe(false);
  });

  it('is true when any facet has a value', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, tags: ['ferry'] })).toBe(true);
  });
});

describe('toggleValue', () => {
  it('adds a missing value and removes a present one', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('URL round-tripping', () => {
  it('omits defaults so an unfiltered view has a clean URL', () => {
    expect(filtersToSearchParams(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('round-trips every facet', () => {
    const filters = {
      search: 'kafka', topics: ['streaming', 'kafka'], tags: ['KTables', 'GraphQL Codegen'],
      languages: ['Kotlin'], sort: 'stars' as const,
    };
    expect(filtersFromSearchParams(filtersToSearchParams(filters))).toEqual(filters);
  });

  it('survives a tag containing a space', () => {
    const params = filtersToSearchParams({ ...DEFAULT_FILTERS, tags: ['GraphQL Codegen'] });
    expect(filtersFromSearchParams(params).tags).toEqual(['GraphQL Codegen']);
  });

  it('falls back to the default sort when the param is unrecognised', () => {
    expect(filtersFromSearchParams(new URLSearchParams('sort=bogus')).sort).toBe('recent');
  });

  it('ignores empty entries in a comma-separated list', () => {
    expect(filtersFromSearchParams(new URLSearchParams('topic=kafka,,')).topics).toEqual(['kafka']);
  });

  it('reads an empty query string as the defaults', () => {
    expect(filtersFromSearchParams(new URLSearchParams(''))).toEqual(DEFAULT_FILTERS);
  });
});
