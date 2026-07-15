import { describe, it, expect } from 'vitest';
import { formatTopic, aggregateTopics } from '../utils/topics';

describe('formatTopic', () => {
  it('returns known label for known slug', () => {
    expect(formatTopic('kotlin-multiplatform')).toBe('Kotlin Multiplatform');
    expect(formatTopic('rest-api')).toBe('REST API');
    expect(formatTopic('aws')).toBe('AWS');
    expect(formatTopic('kmp')).toBe('KMP');
    expect(formatTopic('j2ee')).toBe('J2EE');
  });

  it('title-cases unknown kebab-case slugs', () => {
    expect(formatTopic('some-new-topic')).toBe('Some New Topic');
    expect(formatTopic('android')).toBe('Android');
    expect(formatTopic('kafka')).toBe('Kafka');
  });
});

describe('aggregateTopics', () => {
  const repos = [
    { name: 'repo-a', topics: ['kafka', 'streaming', 'data-engineering'] },
    { name: 'repo-b', topics: ['kafka', 'data-engineering'] },
    { name: 'repo-c', topics: ['android'] },
  ];

  it('counts topic frequency correctly', () => {
    const { count } = aggregateTopics(repos);
    expect(count['kafka']).toBe(2);
    expect(count['data-engineering']).toBe(2);
    expect(count['streaming']).toBe(1);
    expect(count['android']).toBe(1);
  });

  it('maps each topic to the repos that use it', () => {
    const { repos: repoMap } = aggregateTopics(repos);
    expect(repoMap['kafka']).toEqual(['repo-a', 'repo-b']);
    expect(repoMap['android']).toEqual(['repo-c']);
  });

  it('returns empty aggregation for repos with no topics', () => {
    const { count, repos: repoMap } = aggregateTopics([{ name: 'empty', topics: [] }]);
    expect(Object.keys(count)).toHaveLength(0);
    expect(Object.keys(repoMap)).toHaveLength(0);
  });
});
