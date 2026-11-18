import { Avatar, Box, Link, Typography } from "@mui/material";
import type { GitHubProfile } from "../types/github";

interface Props {
  profile: GitHubProfile;
  /** Overrides the GitHub profile name, which is often a handle rather than a full name. */
  name?: string;
  intro?: string;
}

export function HeroSection({ profile, name, intro }: Props) {
  const paragraphs = (intro ?? "").split("\n\n").map((p) => p.trim()).filter(Boolean);

  return (
    <Box component="header" sx={{ pt: 4, pb: 1, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: paragraphs.length ? 3 : 0 }}>
        <Avatar src={profile.avatar_url} alt="" sx={{ width: 72, height: 72 }} />
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            {name || profile.name || profile.login}
          </Typography>
          <Link href={profile.html_url} target="_blank" rel="noopener noreferrer" underline="hover" variant="body2">
            github.com/{profile.login}
          </Link>
        </Box>
      </Box>
      {paragraphs.map((para, i) => (
        <Typography key={i} variant="body1" sx={{ maxWidth: 680, lineHeight: 1.7, mb: 1.5 }}>
          {para}
        </Typography>
      ))}
    </Box>
  );
}
