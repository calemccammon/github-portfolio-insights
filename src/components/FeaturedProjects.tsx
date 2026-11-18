import { Box, Link, Paper, Typography } from "@mui/material";
import type { FeaturedProject, GitHubRepo } from "../types/github";
import { languageColor } from "../utils/languages";

interface Props {
  featured: FeaturedProject[];
  repos: GitHubRepo[];
  techTags: Record<string, string[]> | null;
}

export function FeaturedProjects({ featured, repos, techTags }: Props) {
  const byName = new Map(repos.map((r) => [r.name, r]));
  // A write-up for a repo that was renamed or deleted has nothing to link to.
  const live = featured.flatMap((project) => {
    const repo = byName.get(project.repo);
    return repo ? [{ project, repo }] : [];
  });
  if (live.length === 0) return null;

  return (
    <Box component="section" sx={{ mb: 5 }}>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1.5 }}>
        Selected projects
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {live.map(({ project, repo }) => {
          const tags = techTags?.[repo.name] ?? [];
          const links = [{ label: "Source", url: repo.html_url }, ...(project.links ?? [])];
          return (
            <Paper key={repo.name} component="article" elevation={0} sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 2, mb: 1 }}>
                <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
                  {repo.name}
                </Typography>
                {repo.language && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Box
                      component="span"
                      sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: languageColor(repo.language) }}
                    />
                    <Typography variant="caption" color="text.secondary">{repo.language}</Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>{project.summary}</Typography>
              <Box component="ul" sx={{ pl: 2.5, my: 1.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
                {project.points.map((point) => (
                  <Typography key={point} component="li" variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {point}
                  </Typography>
                ))}
              </Box>
              {tags.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  {tags.join(" · ")}
                </Typography>
              )}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
                {links.map((link) => (
                  <Link
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    variant="body2"
                    sx={{ fontWeight: 500 }}
                    // The visible label repeats on every card, so name the project for screen readers.
                    aria-label={`${link.label}: ${repo.name}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
