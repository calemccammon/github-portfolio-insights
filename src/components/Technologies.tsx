import { Box, Typography } from "@mui/material";
import type { TagGroup } from "../types/github";
import { tagUsage } from "../utils/content";
import { FilterChip } from "./FilterChip";

interface Props {
  techTags: Record<string, string[]> | null;
  groups: TagGroup[];
  selected: string[];
  onToggle: (tag: string) => void;
}

const OTHER = "Other";

export function Technologies({ techTags, groups, selected, onToggle }: Props) {
  if (!techTags || Object.keys(techTags).length === 0) return null;

  const { count, repos } = tagUsage(techTags);
  const mostUsedFirst = (a: string, b: string) => count[b] - count[a];

  // Only tags some live repo still carries are shown, and a tag missing from
  // every group still gets a chip, so a stale content file cannot hide a filter.
  const grouped = new Set(groups.flatMap((g) => g.tags));
  const ungrouped = Object.keys(count).filter((tag) => !grouped.has(tag));
  const sections = [...groups, { label: OTHER, tags: ungrouped }]
    .map((g) => ({ label: g.label, tags: g.tags.filter((tag) => count[tag]).sort(mostUsedFirst) }))
    .filter((g) => g.tags.length > 0);
  const showLabels = sections.some((g) => g.label !== OTHER);

  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>Technologies</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select one or more to filter the repositories below. The number is how many repositories use it.
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {sections.map((section) => (
          <Box key={section.label} role="group" aria-label={section.label}>
            {showLabels && (
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", lineHeight: 1.5, mb: 0.75 }}>
                {section.label}
              </Typography>
            )}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {section.tags.map((tag) => (
                <FilterChip
                  key={tag}
                  label={tag}
                  count={count[tag]}
                  repoNames={repos[tag] ?? []}
                  selected={selected.includes(tag)}
                  onToggle={() => onToggle(tag)}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
