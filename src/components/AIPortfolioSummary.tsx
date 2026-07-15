import { Box, Typography, Paper } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface Props {
  narrative: string | null;
}

export function AIPortfolioSummary({ narrative }: Props) {
  if (!narrative) return null;

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <AutoAwesomeIcon sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
          AI Portfolio Analysis
        </Typography>
      </Box>
      {narrative.split("\n\n").map((para, i) => (
        <Typography
          key={i}
          variant="body2"
          color="text.secondary"
          sx={{ mb: i < narrative.split("\n\n").length - 1 ? 1.5 : 0, lineHeight: 1.75 }}
        >
          {para.trim()}
        </Typography>
      ))}
    </Paper>
  );
}
