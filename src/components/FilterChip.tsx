import { Box, Chip, Tooltip } from "@mui/material";

interface Props {
  label: string;
  count: number;
  repoNames: string[];
  selected: boolean;
  onToggle: () => void;
}

/**
 * A chip in the Topics or Patterns cloud. Selecting one filters the repository
 * grid below, so it has to read as a control rather than as decoration: MUI
 * gives it button semantics via onClick, and aria-pressed carries the selected
 * state to assistive tech, which the fill colour alone would not.
 */
export function FilterChip({ label, count, repoNames, selected, onToggle }: Props) {
  const text = count > 1 ? `${label} ×${count}` : label;
  const frequent = count >= 3;

  return (
    <Tooltip
      title={
        <Box>
          {repoNames.map((name) => (
            <Box key={name} sx={{ fontSize: 12, py: 0.25 }}>{name}</Box>
          ))}
        </Box>
      }
      arrow
      placement="top"
    >
      <Chip
        label={text}
        size="small"
        onClick={onToggle}
        aria-pressed={selected}
        variant={selected ? "filled" : "outlined"}
        color={selected ? "primary" : "default"}
        sx={{
          cursor: "pointer",
          fontWeight: selected || frequent ? 600 : 400,
          ...(selected
            ? { color: "#0d1117" }
            : {
                borderColor: "#30363d",
                color: "text.primary",
                // A frequently-used topic keeps its subtle tint when unselected;
                // once selected the solid primary fill takes over entirely.
                backgroundColor: frequent ? "#58a6ff22" : "transparent",
                "&:hover": { backgroundColor: "#58a6ff33" },
              }),
        }}
      />
    </Tooltip>
  );
}
