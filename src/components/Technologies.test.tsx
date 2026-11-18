import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Technologies } from '../components/Technologies';
import { renderWithTheme } from '../test/renderWithTheme';

const TAGS = { 'repo-a': ['Kafka', 'dbt', 'Flutter'], 'repo-b': ['dbt'] };
const GROUPS = [
  { label: 'Data', tags: ['Kafka', 'dbt', 'Airflow'] },
  { label: 'Mobile', tags: ['Flutter'] },
];

function render(props: Partial<Parameters<typeof Technologies>[0]> = {}) {
  return renderWithTheme(
    <Technologies techTags={TAGS} groups={GROUPS} selected={[]} onToggle={() => {}} {...props} />,
  );
}

describe('Technologies', () => {
  it('renders nothing when there are no tags', () => {
    expect(render({ techTags: null }).container.firstChild).toBeNull();
    expect(render({ techTags: {} }).container.firstChild).toBeNull();
  });

  it('puts each tag under its group, most-used first', () => {
    render();
    const data = within(screen.getByRole('group', { name: 'Data' }));
    expect(data.getAllByRole('button').map((b) => b.textContent)).toEqual(['dbt ×2', 'Kafka']);
    expect(within(screen.getByRole('group', { name: 'Mobile' })).getByText('Flutter')).toBeInTheDocument();
  });

  it('leaves out a grouped tag that no repository uses', () => {
    render();
    expect(screen.queryByText('Airflow')).not.toBeInTheDocument();
  });

  it('still shows a tag that is missing from every group', () => {
    render({ techTags: { 'repo-a': ['Kafka', 'Ktor'] } });
    expect(within(screen.getByRole('group', { name: 'Other' })).getByText('Ktor')).toBeInTheDocument();
  });

  it('reports the tag that was selected', async () => {
    const onToggle = vi.fn();
    render({ onToggle });
    await userEvent.click(screen.getByRole('button', { name: 'Kafka' }));
    expect(onToggle).toHaveBeenCalledWith('Kafka');
  });

  it('marks selected tags as pressed', () => {
    render({ selected: ['Kafka'] });
    expect(screen.getByRole('button', { name: 'Kafka' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Flutter' })).toHaveAttribute('aria-pressed', 'false');
  });
});
