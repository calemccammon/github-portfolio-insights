import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AIPortfolioSummary } from '../components/AIPortfolioSummary';
import { renderWithTheme } from '../test/renderWithTheme';

describe('AIPortfolioSummary', () => {
  it('renders nothing when narrative is null', () => {
    const { container } = renderWithTheme(<AIPortfolioSummary narrative={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders narrative text', () => {
    renderWithTheme(<AIPortfolioSummary narrative="This engineer builds data pipelines." />);
    expect(screen.getByText('This engineer builds data pipelines.')).toBeInTheDocument();
  });

  it('renders multiple paragraphs split on double newline', () => {
    renderWithTheme(
      <AIPortfolioSummary narrative={"First paragraph.\n\nSecond paragraph."} />
    );
    expect(screen.getByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
  });

  it('shows the AI Portfolio Analysis label', () => {
    renderWithTheme(<AIPortfolioSummary narrative="Some text." />);
    expect(screen.getByText('AI Portfolio Analysis')).toBeInTheDocument();
  });
});
