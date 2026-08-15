import { Box, Paper, Typography } from "@mui/material";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { languageColor } from "../utils/languages";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  languages: Record<string, number>;
}

export function LanguageChart({ languages }: Props) {
  const total = Object.values(languages).reduce((s, v) => s + v, 0);
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const data = {
    labels: entries.map(([name]) => name),
    datasets: [{
      data: entries.map(([, bytes]) => bytes),
      backgroundColor: entries.map(([name]) => languageColor(name)),
      borderColor: "#161b22",
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
            return (chart.data.labels as string[]).map((label, i) => {
              const value = dataset.data[i] as number;
              const pct = ((value / total) * 100).toFixed(1);
              return {
                text: `${label}  ${pct}%`,
                fillStyle: (dataset.backgroundColor as string[])[i],
                strokeStyle: (dataset.backgroundColor as string[])[i],
                fontColor: "#e6edf3",
                pointStyle: "circle" as const,
                hidden: false,
                index: i,
              };
            });
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) =>
            ` ${ctx.label}: ${((Number(ctx.raw) / total) * 100).toFixed(1)}%`,
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
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Language Distribution</Typography>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Box sx={{ height: 280, position: "relative" }}>
          <Doughnut data={data} options={options} />
        </Box>
      </Paper>
    </Box>
  );
}
