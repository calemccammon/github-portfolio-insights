const KNOWN_TOPICS: Record<string, string> = {
  "kotlin-multiplatform": "Kotlin Multiplatform", "kmp": "KMP", "rest-api": "REST API",
  "web-api": "Web API", "data-engineering": "Data Engineering", "etl": "ETL", "elt": "ELT",
  "medallion-architecture": "Medallion Architecture", "kafka-streams": "Kafka Streams",
  "spring-boot": "Spring Boot", "systems-programming": "Systems Programming",
  "tui": "TUI", "packet-capture": "Packet Capture", "chrome-extension": "Chrome Extension",
  "data-visualization": "Data Visualization", "looker-studio": "Looker Studio",
  "bigquery": "BigQuery", "postgresql": "PostgreSQL", "aws": "AWS", "ios": "iOS",
  "eia-api": "EIA API", "openai": "OpenAI", "j2ee": "J2EE", "llm": "LLM",
};

export function formatTopic(slug: string): string {
  return KNOWN_TOPICS[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface TopicAggregation {
  count: Record<string, number>;
  repos: Record<string, string[]>;
}

export function aggregateTopics(
  repos: Array<{ name: string; topics: string[] }>
): TopicAggregation {
  const count: Record<string, number> = {};
  const repoMap: Record<string, string[]> = {};
  for (const repo of repos) {
    for (const topic of repo.topics) {
      count[topic] = (count[topic] ?? 0) + 1;
      repoMap[topic] = [...(repoMap[topic] ?? []), repo.name];
    }
  }
  return { count, repos: repoMap };
}
