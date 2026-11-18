import { describe, it, expect } from 'vitest';
import committed from '../data/content.json';
import { contentProblems, tagUsage } from '../utils/content';
import type { PortfolioContent } from '../types/github';

function valid(over: Partial<PortfolioContent> = {}): PortfolioContent {
  const project = (repo: string) => ({ repo, summary: 'What it does.', points: ['One.', 'Two.'] });
  return {
    intro: 'A short introduction.',
    featured: ['a', 'b', 'c', 'd'].map(project),
    tagGroups: [{ label: 'Data', tags: ['dbt', 'Kafka'] }],
    techTags: { a: ['dbt'], b: ['dbt'], c: ['Kafka'], d: ['Kafka'] },
    ...over,
  };
}

describe('the committed content.json', () => {
  // This is the check that stops a bad edit to the page content before deploy.
  it('follows the rules in src/data/README.md', () => {
    expect(contentProblems(committed)).toEqual([]);
  });
});

describe('contentProblems', () => {
  it('accepts well-formed content', () => {
    expect(contentProblems(valid())).toEqual([]);
  });

  it('reports every missing section of an empty file, without throwing', () => {
    expect(contentProblems(null)).toEqual([
      'intro is missing', 'techTags is missing', 'tagGroups is missing', 'featured is missing',
    ]);
  });

  it('rejects an intro over the word limit', () => {
    expect(contentProblems(valid({ intro: 'word '.repeat(81) }))).toEqual(['intro is over 80 words']);
  });

  it('rejects a tag containing a comma, which would split in the URL', () => {
    const problems = contentProblems(valid({
      tagGroups: [{ label: 'Data', tags: ['dbt', 'Kafka', 'ETL, ELT'] }],
      techTags: { a: ['dbt', 'ETL, ELT'], b: ['dbt'], c: ['Kafka'], d: ['Kafka'] },
    }));
    expect(problems).toEqual(['a: tag "ETL, ELT" contains a comma']);
  });

  it('rejects a repeated tag and an empty tag list', () => {
    const problems = contentProblems(valid({ techTags: { a: ['dbt', 'dbt'], b: [], c: ['Kafka'], d: ['Kafka'] } }));
    expect(problems).toContain('a: repeats a tag');
    expect(problems).toContain('b: has no tags');
  });

  it('requires every used tag to be in exactly one group', () => {
    expect(contentProblems(valid({ tagGroups: [{ label: 'Data', tags: ['dbt'] }] })))
      .toEqual(['tag "Kafka" is not in any group']);

    expect(contentProblems(valid({
      tagGroups: [{ label: 'Data', tags: ['dbt', 'Kafka'] }, { label: 'Backend', tags: ['Kafka'] }],
    }))).toEqual(['tag "Kafka" is in two groups: Data and Backend']);
  });

  it('rejects a grouped tag that no repository uses', () => {
    expect(contentProblems(valid({ tagGroups: [{ label: 'Data', tags: ['dbt', 'Kafka', 'Airflow'] }] })))
      .toEqual(['tag "Airflow" in group Data is not used by any repository']);
  });

  it('limits how many projects are featured and how many points each has', () => {
    const base = valid();
    expect(contentProblems({ ...base, featured: base.featured.slice(0, 3) }))
      .toEqual(['featured has 3 projects; expected 4 to 6']);

    const onePoint = [{ ...base.featured[0], points: ['Only one.'] }, ...base.featured.slice(1)];
    expect(contentProblems({ ...base, featured: onePoint })).toEqual(['a: has 1 points; expected 2 to 3']);
  });

  it('requires a featured project to have tags and https links', () => {
    const base = valid();
    const featured = [
      { ...base.featured[0], repo: 'untagged', links: [{ label: 'Demo', url: 'http://example.com' }] },
      ...base.featured.slice(1),
    ];
    expect(contentProblems({ ...base, featured })).toEqual([
      'untagged: featured but has no techTags entry',
      'untagged: link "Demo" is not an https URL',
    ]);
  });
});

describe('tagUsage', () => {
  it('counts the repositories using each tag and lists them', () => {
    expect(tagUsage({ a: ['dbt', 'Kafka'], b: ['dbt'] })).toEqual({
      count: { dbt: 2, Kafka: 1 },
      repos: { dbt: ['a', 'b'], Kafka: ['a'] },
    });
  });
});
