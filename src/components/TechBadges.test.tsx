import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TechBadges } from '../components/TechBadges';
import { renderWithTheme } from '../test/renderWithTheme';
import type { GitHubRepo } from '../types/github';

const REPOS = [
  { name: 'alpha', topics: ['kafka', 'graphql'] },
  { name: 'beta', topics: ['kafka'] },
] as GitHubRepo[];

describe('TechBadges', () => {
  it('humanises slugs and shows a count only when a topic repeats', () => {
    renderWithTheme(<TechBadges repos={REPOS} selected={[]} onToggle={() => {}} />);
    expect(screen.getByText('Kafka ×2')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
  });

  it('reports the underlying slug, not the display label, when clicked', async () => {
    const onToggle = vi.fn();
    renderWithTheme(<TechBadges repos={REPOS} selected={[]} onToggle={onToggle} />);

    await userEvent.click(screen.getByText('GraphQL'));
    expect(onToggle).toHaveBeenCalledWith('graphql');
  });

  it('exposes selection state to assistive tech, not just as colour', () => {
    renderWithTheme(<TechBadges repos={REPOS} selected={['kafka']} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Kafka ×2' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'GraphQL' })).toHaveAttribute('aria-pressed', 'false');
  });
});
