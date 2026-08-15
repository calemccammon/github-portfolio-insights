import { useState } from "react";
import { Box, Paper, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { GitHubRepo } from "../types/github";
import { languageColor } from "../utils/languages";
import { repoCountsByLanguage } from "../utils/filters";

ChartJS.register(ArcElement, Tooltip, Legend);

type Lens = "bytes" | "repos";

interface Props {
  languages: Record<string, number>;
  repos: GitHubRepo[];
  selected: string[];
  onToggleLanguage: (language: string) => void;
}

export function LanguageChart({ languages, repos, selected, onToggleLanguage }: Props) {
  const [lens, setLens] = useState<Lens>("bytes");

  // The chart always describes the whole portfolio, never the filtered subset --
  // otherwise selecting a language would collapse it to a single slice and the
  // distribution it exists to show would disappear.
  const source = lens === "bytes" ? languages : repoCountsByLanguage(repos);
  const total = Object.values(source).reduce((s, v) => s + v, 0);
  const entries = Object.entries(source).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const labels = entries.map(([name]) => name);

  const format = (value: number) =>
    lens === "bytes"
      ? `${((value / total) * 100).toFixed(1)}%`
      : `${value} ${value === 1 ? "repo" : "repos"}`;

  const data = {
    labels,
    datasets: [{
      data: entries.map(([, value]) => value),
      backgroundColor: labels.map((name) => languageColor(name)),
      borderColor: "#161b22",
      borderWidth: 2,
      hoverOffset: 6,
      // Selected slices sit proud of the ring, so the chart reflects the filter
      // rather than just setting it.
      offset: labels.map((name) => (selected.includes(name) ? 14 : 0)),
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event: unknown, elements: Array<{ index: number }>) => {
      if (elements.length > 0) onToggleLanguage(labels[elements[0].index]);
    },
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "#e6edf3",
          font: { family: "Roboto, sans-serif", size: 13 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          generateLabels: (chart: ChartJS) => {
            const dataset = chart.data.datasets[0];
            return (chart.data.labels as string[]).map((label, i) => ({
              text: `${label}  ${format(dataset.data[i] as number)}`,
              fillStyle: (dataset.backgroundColor as string[])[i],
              strokeStyle: (dataset.backgroundColor as string[])[i],
              fontColor: "#e6edf3",
              pointStyle: "circle" as const,
              hidden: false,
              index: i,
            }));
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) => ` ${ctx.label}: ${format(Number(ctx.raw))}`,
        },
        bodyFont: { family: "Roboto, sans-serif" },
        titleFont: { family: "Roboto, sans-serif" },
        backgroundColor: "#161b22",
        borderColor: "#30363d",
        borderWidth: 1,
      },
    },
    cutout: "65%",
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          mb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Language Distribution</Typography>
          <Typography variant="body2" color="text.secondary">
            {lens === "bytes"
              ? "Bytes of code per language — click a slice to filter"
              : "Repositories per primary language — click a slice to filter"}
          </Typography>
        </Box>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={lens}
          onChange={(_e, next: Lens | null) => { if (next) setLens(next); }}
          aria-label="Language distribution measure"
        >
          <ToggleButton value="bytes" sx={{ textTransform: "none", px: 1.5 }}>By bytes</ToggleButton>
          <ToggleButton value="repos" sx={{ textTransform: "none", px: 1.5 }}>By repo</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Box sx={{ height: 280, position: "relative" }}>
          <Doughnut data={data} options={options} />
        </Box>
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Byte counts reward verbose languages and large generated or vendored files; the
        per-repository count weights every project equally. Neither is the whole picture.
      </Typography>
    </Box>
  );
}
