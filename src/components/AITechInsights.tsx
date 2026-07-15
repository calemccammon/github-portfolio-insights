import { Box, Chip, Tooltip, Typography } from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";

interface Props {
  aiTechTags: Record<string, string[]> | null;
}

export function AITechInsights({ aiTechTags }: Props) {
  if (!aiTechTags || Object.keys(aiTechTags).length === 0) return null;

  const tagCount: Record<string, number> = {};
  const tagRepos: Record<string, string[]> = {};

  for (const [repo, tags] of Object.entries(aiTechTags)) {
    for (const tag of tags) {
      tagCount[tag] = (tagCount[tag] ?? 0) + 1;
      tagRepos[tag] = [...(tagRepos[tag] ?? []), repo];
    }
  }

  const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <PsychologyIcon sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Patterns &amp; Libraries</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Extracted from README content by AI
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {sorted.map(([tag, count]) => {
          const repoNames = tagRepos[tag] ?? [];
          return (
            <Tooltip
              key={tag}
              title={<Box>{repoNames.map((name) => <Box key={name} sx={{ fontSize: 12, py: 0.25 }}>{name}</Box>)}</Box>}
              arrow
              placement="top"
            >
              <Chip
                label={count > 1 ? `${tag} ×${count}` : tag}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "#30363d",
                  color: "text.primary",
                  backgroundColor: count >= 3 ? "#3fb95022" : "transparent",
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
