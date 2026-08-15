import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_FILTERS,
  filtersFromSearchParams,
  filtersToSearchParams,
  toggleValue,
  type RepoFilters,
  type SortKey,
} from "../utils/filters";

export interface RepoFilterControls {
  filters: RepoFilters;
  toggleTopic: (topic: string) => void;
  toggleTag: (tag: string) => void;
  toggleLanguage: (language: string) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortKey) => void;
  setLanguages: (languages: string[]) => void;
  clearAll: () => void;
}

/**
 * Filter state, mirrored into the query string so any filtered view can be
 * linked, bookmarked, or reloaded without losing it.
 */
export function useRepoFilters(): RepoFilterControls {
  const [filters, setFilters] = useState<RepoFilters>(() =>
    filtersFromSearchParams(new URLSearchParams(window.location.search)),
  );

  useEffect(() => {
    const query = filtersToSearchParams(filters).toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    // replaceState, not pushState: refining a filter is not navigation, and
    // pushing would bury the previous page under one back-button step per chip.
    window.history.replaceState(null, "", next);
  }, [filters]);

  const toggleTopic = useCallback(
    (topic: string) => setFilters((f) => ({ ...f, topics: toggleValue(f.topics, topic) })),
    [],
  );
  const toggleTag = useCallback(
    (tag: string) => setFilters((f) => ({ ...f, tags: toggleValue(f.tags, tag) })),
    [],
  );
  const toggleLanguage = useCallback(
    (language: string) =>
      setFilters((f) => ({ ...f, languages: toggleValue(f.languages, language) })),
    [],
  );
  const setSearch = useCallback((search: string) => setFilters((f) => ({ ...f, search })), []);
  const setSort = useCallback((sort: SortKey) => setFilters((f) => ({ ...f, sort })), []);
  const setLanguages = useCallback(
    (languages: string[]) => setFilters((f) => ({ ...f, languages })),
    [],
  );
  // Sort survives a clear -- it is a view preference, not something being filtered out.
  const clearAll = useCallback(
    () => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort })),
    [],
  );

  return {
    filters,
    toggleTopic,
    toggleTag,
    toggleLanguage,
    setSearch,
    setSort,
    setLanguages,
    clearAll,
  };
}
