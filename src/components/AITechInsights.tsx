import { Box, Typography } from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { FilterChip } from "./FilterChip";

interface Props {
  aiTechTags: Record<string, string[]> | null;
  selected: string[];
  onToggle: (tag: string) => void;
}

export function AITechInsights({ aiTechTags, selected, onToggle }: Props) {
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
        Identified per repository by Claude — select to filter
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {sorted.map(([tag, count]) => (
          <FilterChip
            key={tag}
            label={tag}
            count={count}
            repoNames={tagRepos[tag] ?? []}
            selected={selected.includes(tag)}
            onToggle={() => onToggle(tag)}
          />
        ))}
      </Box>
    </Box>
  );
}
