import { Box, Typography } from "@mui/material";
import type { GitHubRepo } from "../types/github";
import { formatTopic, aggregateTopics } from "../utils/topics";
import { FilterChip } from "./FilterChip";

interface Props {
  repos: GitHubRepo[];
  selected: string[];
  onToggle: (topic: string) => void;
}

export function TechBadges({ repos, selected, onToggle }: Props) {
  const { count: topicCount, repos: topicRepos } = aggregateTopics(repos);
  const sorted = Object.entries(topicCount).sort((a, b) => b[1] - a[1]);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Topics</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Declared on each repository — select to filter
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {sorted.map(([topic, count]) => (
          <FilterChip
            key={topic}
            label={formatTopic(topic)}
            count={count}
            repoNames={topicRepos[topic] ?? []}
            selected={selected.includes(topic)}
            onToggle={() => onToggle(topic)}
          />
        ))}
      </Box>
    </Box>
  );
}
