import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { FeaturedProjects } from '../components/FeaturedProjects';
import { renderWithTheme } from '../test/renderWithTheme';
import type { FeaturedProject, GitHubRepo } from '../types/github';

const REPO: GitHubRepo = {
  id: 1, name: 'k2l', full_name: 'calemccammon/k2l', description: null,
  html_url: 'https://github.com/calemccammon/k2l', language: 'Kotlin', stargazers_count: 0,
  forks_count: 0, fork: false, archived: false, pushed_at: '2026-10-01T00:00:00Z',
  created_at: '2026-10-01T00:00:00Z', topics: [],
};

const PROJECT: FeaturedProject = {
  repo: 'k2l',
  summary: 'A compiler from Kotlin to Lua.',
  points: ['First point.', 'Second point.'],
  links: [{ label: 'Docs', url: 'https://example.com/docs' }],
};

describe('FeaturedProjects', () => {
  it('renders nothing when no project is featured', () => {
    const { container } = renderWithTheme(<FeaturedProjects featured={[]} repos={[REPO]} techTags={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the summary, the points and the tags', () => {
    renderWithTheme(
      <FeaturedProjects featured={[PROJECT]} repos={[REPO]} techTags={{ k2l: ['Compiler', 'Source Maps'] }} />,
    );
    expect(screen.getByRole('heading', { name: 'k2l' })).toBeInTheDocument();
    expect(screen.getByText('A compiler from Kotlin to Lua.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['First point.', 'Second point.']);
    expect(screen.getByText('Compiler · Source Maps')).toBeInTheDocument();
  });

  it('links to the repository first, then to the extra links', () => {
    renderWithTheme(<FeaturedProjects featured={[PROJECT]} repos={[REPO]} techTags={null} />);
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://github.com/calemccammon/k2l', 'https://example.com/docs',
    ]);
    expect(links[0]).toHaveAccessibleName('Source: k2l');
  });

  it('skips a write-up whose repository no longer exists', () => {
    renderWithTheme(
      <FeaturedProjects featured={[PROJECT, { ...PROJECT, repo: 'deleted-repo' }]} repos={[REPO]} techTags={null} />,
    );
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });
});
