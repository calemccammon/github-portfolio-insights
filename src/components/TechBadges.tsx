import { Box, Chip, Tooltip, Typography } from "@mui/material";
import type { GitHubRepo } from "../types/github";
import { formatTopic, aggregateTopics } from "../utils/topics";

interface Props {
  repos: GitHubRepo[];
}

export function TechBadges({ repos }: Props) {
  const { count: topicCount, repos: topicRepos } = aggregateTopics(repos);
  const sorted = Object.entries(topicCount).sort((a, b) => b[1] - a[1]);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Topics</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        All topics applied across the repos
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {sorted.map(([topic, count]) => {
          const label = formatTopic(topic);
          const repoNames = topicRepos[topic] ?? [];
          return (
            <Tooltip
              key={topic}
              title={<Box>{repoNames.map((name) => <Box key={name} sx={{ fontSize: 12, py: 0.25 }}>{name}</Box>)}</Box>}
              arrow
              placement="top"
            >
              <Chip
                label={count > 1 ? `${label} ×${count}` : label}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "#30363d",
                  color: "text.primary",
                  backgroundColor: count >= 3 ? "#58a6ff22" : "transparent",
                  fontWeight: count >= 3 ? 600 : 400,
                  cursor: "default",
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

