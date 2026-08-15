import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RepoGrid } from '../components/RepoGrid';
import { renderWithTheme } from '../test/renderWithTheme';
import { DEFAULT_FILTERS, type RepoFilters } from '../utils/filters';
import type { GitHubRepo } from '../types/github';

function repo(name: string, over: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    id: name.length, name, full_name: `calemccammon/${name}`, description: `${name} description`,
    html_url: `https://github.com/calemccammon/${name}`, language: 'Dart', stargazers_count: 0,
    forks_count: 0, fork: false, archived: false, pushed_at: '2026-08-01T00:00:00Z',
    created_at: '2020-01-01T00:00:00Z', topics: ['flutter'], ...over,
  };
}

const REPOS = [
  repo('alpha'),
  repo('beta', { language: 'Kotlin', topics: ['kafka'] }),
];

const NOOP = {
  onSearchChange: () => {}, onSortChange: () => {}, onLanguagesChange: () => {},
  onToggleTopic: () => {}, onToggleTag: () => {}, onClearAll: () => {},
};

function render(filters: Partial<RepoFilters> = {}, overrides = {}) {
  return renderWithTheme(
    <RepoGrid
      repos={REPOS}
      aiTechTags={{ alpha: ['Riverpod'] }}
      filters={{ ...DEFAULT_FILTERS, ...filters }}
      {...NOOP}
      {...overrides}
    />,
  );
}

describe('RepoGrid', () => {
  it('shows a plain count when nothing is filtered', () => {
    render();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.queryByText('Filtering by:')).not.toBeInTheDocument();
  });

  it('narrows the grid and shows a "n of m" count when filtered', () => {
    render({ topics: ['kafka'] });
    expect(screen.getByText('(1 of 2)')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
    expect(screen.queryByText('alpha')).not.toBeInTheDocument();
  });

  it('renders a removable chip for each active filter', () => {
    render({ topics: ['kafka'], tags: ['Riverpod'], languages: ['Dart'], search: 'alpha' });
    // Scoped to the filter bar: "Dart" also appears as the Language select's value.
    const bar = within(screen.getByRole('group', { name: 'Active filters' }));
    expect(bar.getByText('Kafka')).toBeInTheDocument();      // slug is humanised
    expect(bar.getByText('Riverpod')).toBeInTheDocument();
    expect(bar.getByText('Dart')).toBeInTheDocument();
    expect(bar.getByText('"alpha"')).toBeInTheDocument();
  });

  it('offers a way out when filters match nothing', async () => {
    const onClearAll = vi.fn();
    render({ topics: ['kafka'], languages: ['Dart'] }, { onClearAll });

    expect(screen.getByText('No repositories match these filters.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it('reports typed search text', async () => {
    const onSearchChange = vi.fn();
    render({}, { onSearchChange });

    await userEvent.type(screen.getByLabelText('Search repositories'), 'k');
    expect(onSearchChange).toHaveBeenCalledWith('k');
  });

  it('lists only languages actually present in the repos', async () => {
    render();
    await userEvent.click(screen.getByLabelText('Language'));
    expect(screen.getByRole('option', { name: 'Dart' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Kotlin' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Python' })).not.toBeInTheDocument();
  });
});
