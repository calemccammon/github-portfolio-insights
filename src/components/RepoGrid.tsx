import { Box, Card, CardActionArea, CardContent, Chip, Grid, Typography } from "@mui/material";
import type { GitHubRepo } from "../types/github";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Kotlin: "#A97BFF", Java: "#b07219", Go: "#00ADD8", Rust: "#dea584",
  HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", SQL: "#e38c00", Dockerfile: "#384d54",
};

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function RepoCard({ repo }: { repo: GitHubRepo }) {
  const color = LANGUAGE_COLORS[repo.language ?? ""] ?? "#8b949e";
  return (
    <Card elevation={0} sx={{ height: "100%" }}>
      <CardActionArea
        component="a"
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", p: 2 }}
      >
        <CardContent sx={{ p: 0, width: "100%", flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, maxWidth: "75%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {repo.name}
            </Typography>
            {repo.archived && <Chip label="archived" size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />}
          </Box>
          {repo.description && (
            <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {repo.description}
            </Typography>
          )}
          {repo.topics.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {repo.topics.slice(0, 4).map((t) => (
                <Chip key={t} label={t} size="small" color="primary" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
              ))}
            </Box>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: "auto", pt: 1 }}>
            {repo.language && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box component="span" sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary">{repo.language}</Typography>
              </Box>
            )}
            {repo.stargazers_count > 0 && (
              <Typography variant="caption" color="text.secondary">⭐ {repo.stargazers_count}</Typography>
            )}
            {repo.forks_count > 0 && (
              <Typography variant="caption" color="text.secondary">🍴 {repo.forks_count}</Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>{timeAgo(repo.pushed_at)}</Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

interface Props {
  repos: GitHubRepo[];
}

export function RepoGrid({ repos }: Props) {
  const sorted = [...repos].sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Repositories{" "}
        <Typography component="span" variant="body2" color="text.secondary">({repos.length})</Typography>
      </Typography>
      <Grid container spacing={2}>
        {sorted.map((repo) => (
          <Grid key={repo.id} size={{ xs: 12, sm: 6 }}>
            <RepoCard repo={repo} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
