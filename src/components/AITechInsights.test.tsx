import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AITechInsights } from '../components/AITechInsights';
import { renderWithTheme } from '../test/renderWithTheme';

describe('AITechInsights', () => {
  it('renders nothing when aiTechTags is null', () => {
    const { container } = renderWithTheme(<AITechInsights aiTechTags={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when aiTechTags is empty', () => {
    const { container } = renderWithTheme(<AITechInsights aiTechTags={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a chip for each unique tag', () => {
    renderWithTheme(
      <AITechInsights aiTechTags={{ 'repo-a': ['Kafka', 'dbt'], 'repo-b': ['dbt'] }} />
    );
    expect(screen.getByText('Kafka')).toBeInTheDocument();
    expect(screen.getByText('dbt ×2')).toBeInTheDocument();
  });

  it('shows section heading', () => {
    renderWithTheme(
      <AITechInsights aiTechTags={{ 'repo-a': ['Coroutines'] }} />
    );
    expect(screen.getByText('Patterns & Libraries')).toBeInTheDocument();
  });
});
