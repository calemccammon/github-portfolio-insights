export interface GitHubProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
  created_at: string;
  topics: string[];
}

/** bytes per language for a single repo: { TypeScript: 12345, Python: 6789 } */
export type RepoLanguages = Record<string, number>;

export interface GitHubStats {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  /** aggregated language bytes across all repos */
  languages: Record<string, number>;
  /** AI-generated portfolio narrative */
  aiNarrative: string | null;
  /** AI-extracted tech tags per repo from README analysis */
  aiTechTags: Record<string, string[]> | null;
  fetchedAt: string;
}
