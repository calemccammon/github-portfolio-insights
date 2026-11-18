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

export interface FeaturedLink {
  label: string;
  url: string;
}

export interface FeaturedProject {
  /** repository name, exactly as on GitHub */
  repo: string;
  summary: string;
  points: string[];
  links?: FeaturedLink[];
}

export interface TagGroup {
  label: string;
  tags: string[];
}

/** The shape of src/data/content.json. src/data/README.md explains each field. */
export interface PortfolioContent {
  name?: string;
  intro: string;
  featured: FeaturedProject[];
  tagGroups: TagGroup[];
  techTags: Record<string, string[]>;
}

/** The part of the content the page renders directly; techTags travel separately. */
export type PageContent = Omit<PortfolioContent, "techTags">;

export interface GitHubStats {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  /** aggregated language bytes across all repos */
  languages: Record<string, number>;
  /** language bytes per repo, keyed by repo name */
  repoLanguages: Record<string, RepoLanguages>;
  /** hand-written page content from src/data/content.json; null if the file is unusable */
  content: PageContent | null;
  /** technology tags per repo, limited to repos that still exist */
  techTags: Record<string, string[]> | null;
  fetchedAt: string;
}
