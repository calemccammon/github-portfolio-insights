import { Box, Paper, Typography } from "@mui/material";
import { Bubble } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { GitHubRepo } from "../types/github";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface Props {
  repos: GitHubRepo[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Kotlin: "#A97BFF", Java: "#b07219", Go: "#00ADD8", Rust: "#dea584",
  HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", SQL: "#e38c00",
  "C#": "#178600", Swift: "#F05138", Dockerfile: "#384d54",
};

function getColor(lang: string): string {
  return LANGUAGE_COLORS[lang] ?? "#8b949e";
}

export function TechTimeline({ repos }: Props) {
  // Group repos by language, assign a y-index per language
  const languages = Array.from(
    new Set(repos.map((r) => r.language).filter(Boolean) as string[])
  ).sort();

  const datasets = languages.map((lang) => {
    const langRepos = repos.filter((r) => r.language === lang);
    return {
      label: lang,
      data: langRepos.map((r) => ({
        x: new Date(r.created_at).getFullYear() + new Date(r.created_at).getMonth() / 12,
        y: languages.indexOf(lang),
        r: 8,
        name: r.name,
        pushed: new Date(r.pushed_at).toLocaleDateString(),
      })),
      backgroundColor: getColor(lang) + "cc",
      borderColor: getColor(lang),
      borderWidth: 1,
    };
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    clip: false as const,
    layout: {
      padding: { top: 12, right: 20, bottom: 4, left: 4 },
    },
    scales: {
      x: {
        min: Math.min(...repos.map((r) => new Date(r.created_at).getFullYear())) - 0.5,
        max: new Date().getFullYear() + 1,
        ticks: {
          color: "#7d8590",
          font: { family: "Roboto, sans-serif", size: 12 },
          callback: (v: number | string) => Math.floor(Number(v)).toString(),
          stepSize: 1,
        },
        grid: { color: "#30363d" },
      },
      y: {
        min: -0.5,
        max: languages.length - 0.5,
        ticks: {
          color: "#7d8590",
          font: { family: "Roboto, sans-serif", size: 12 },
          callback: (_: number | string, i: number) => languages[i] ?? "",
          stepSize: 1,
        },
        grid: { color: "#21262d" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => {
            const d = ctx.raw as { name: string; pushed: string };
            return [`  ${d.name}`, `  last push: ${d.pushed}`];
          },
          title: (items: { dataset: { label: string } }[]) =>
            items[0]?.dataset.label ?? "",
        },
        backgroundColor: "#161b22",
        borderColor: "#30363d",
        borderWidth: 1,
        bodyFont: { family: "Roboto, sans-serif", size: 12 },
        titleFont: { family: "Roboto, sans-serif", size: 13 },
        titleColor: "#e6edf3",
        bodyColor: "#7d8590",
      },
    },
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Tech Adoption Timeline</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        When each language first appeared in the portfolio
      </Typography>
      <Paper elevation={0} sx={{ p: 2 }}>
        <Box sx={{ height: Math.max(200, languages.length * 40 + 40), position: "relative" }}>
          <Bubble data={{ datasets }} options={options as never} />
        </Box>
      </Paper>
    </Box>
  );
}
