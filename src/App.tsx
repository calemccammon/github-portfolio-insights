import { Suspense, lazy, useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, Box, CircularProgress, Link, Skeleton, Typography } from '@mui/material';
import './index.css';
import type { GitHubStats } from './types/github';
import { HeroSection } from './components/HeroSection';
import { FeaturedProjects } from './components/FeaturedProjects';
import { Technologies } from './components/Technologies';
import { RepoGrid } from './components/RepoGrid';
import { useRepoFilters } from './hooks/useRepoFilters';

// Chart.js is by far the heaviest dependency here and nothing above it on the
// page needs it, so it loads as its own chunk instead of blocking first paint.
const TechTimeline = lazy(() =>
  import('./components/TechTimeline').then((m) => ({ default: m.TechTimeline })));
const LanguageChart = lazy(() =>
  import('./components/LanguageChart').then((m) => ({ default: m.LanguageChart })));

/** Reserves the chart's height so swapping it in shifts nothing below. */
function ChartFallback({ height }: { height: number }) {
  return <Skeleton variant="rounded" height={height} sx={{ mb: 4 }} />;
}

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

const SOURCE_URL = 'https://github.com/calemccammon/github-portfolio-insights';
const DATA_URL = new URL('../public/data/github-stats.json', import.meta.url).href;

function App() {
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    filters, toggleTag, toggleLanguage,
    setSearch, setSort, setLanguages, clearAll,
  } = useRepoFilters();

  useEffect(() => {
    // Warm the chart chunks alongside the fetch. Without this the dynamic
    // imports would not start until the data arrives and the charts first
    // render, turning one round trip into two.
    void import('./components/TechTimeline');
    void import('./components/LanguageChart');

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
        <Container component="main" maxWidth="md" sx={{ py: 4 }}>
          <HeroSection profile={stats.profile} name={stats.content?.name} intro={stats.content?.intro} />
          <FeaturedProjects
            featured={stats.content?.featured ?? []}
            repos={stats.repos}
            techTags={stats.techTags}
          />
          <Suspense fallback={<ChartFallback height={260} />}>
            <TechTimeline repos={stats.repos} repoLanguages={stats.repoLanguages ?? {}} />
          </Suspense>
          <Suspense fallback={<ChartFallback height={340} />}>
            <LanguageChart
              languages={stats.languages}
              repos={stats.repos}
              selected={filters.languages}
              onToggleLanguage={toggleLanguage}
            />
          </Suspense>
          <Technologies
            techTags={stats.techTags}
            groups={stats.content?.tagGroups ?? []}
            selected={filters.tags}
            onToggle={toggleTag}
          />
          <RepoGrid
            repos={stats.repos}
            techTags={stats.techTags}
            filters={filters}
            onSearchChange={setSearch}
            onSortChange={setSort}
            onLanguagesChange={setLanguages}
            onToggleTag={toggleTag}
            onClearAll={clearAll}
          />
          <Box component="footer" sx={{ textAlign: "center", py: 4, mt: 2, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">
              Repository data from the GitHub API, fetched {new Date(stats.fetchedAt).toLocaleDateString()} ·{" "}
              <Link href={SOURCE_URL} target="_blank" rel="noopener noreferrer" color="inherit">
                Source for this page
              </Link>
            </Typography>
          </Box>
        </Container>
      )}
    </ThemeProvider>
  );
}

export default App;

