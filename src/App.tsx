import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, Box, CircularProgress, Typography } from '@mui/material';
import './index.css';
import type { GitHubStats } from './types/github';
import { HeroSection } from './components/HeroSection';
import { AIPortfolioSummary } from './components/AIPortfolioSummary';
import { TechTimeline } from './components/TechTimeline';
import { LanguageChart } from './components/LanguageChart';
import { TechBadges } from './components/TechBadges';
import { AITechInsights } from './components/AITechInsights';
import { RepoGrid } from './components/RepoGrid';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#58a6ff' },
    background: { default: '#0d1117', paper: '#161b22' },
    divider: '#30363d',
    text: { primary: '#e6edf3', secondary: '#7d8590' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: '1px solid #30363d' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: '1px solid #30363d' },
      },
    },
  },
});

const DATA_URL = new URL('../public/data/github-stats.json', import.meta.url).href;

function App() {
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load data (${r.status})`);
        return r.json() as Promise<GitHubStats>;
      })
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {error ? (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>Data not available</Typography>
            <Typography variant="body2" color="text.secondary">{error}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Run <code>npx tsx scripts/fetch-github-data.ts</code> to generate it.
            </Typography>
          </Box>
        </Box>
      ) : !stats ? (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <HeroSection profile={stats.profile} />
          <AIPortfolioSummary narrative={stats.aiNarrative} />
          <TechTimeline repos={stats.repos} />
          <LanguageChart languages={stats.languages} />
          <TechBadges repos={stats.repos} />
          <AITechInsights aiTechTags={stats.aiTechTags} />
          <RepoGrid repos={stats.repos} />
          <Box sx={{ textAlign: "center", py: 4, mt: 2, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date(stats.fetchedAt).toLocaleDateString()} · Built with React + Vite + GitHub CLI
            </Typography>
          </Box>
        </Container>
      )}
    </ThemeProvider>
  );
}

export default App;

