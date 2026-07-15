import { Avatar, Box, Typography } from "@mui/material";
import type { GitHubProfile } from "../types/github";

interface Props {
  profile: GitHubProfile;
}

export function HeroSection({ profile }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 6, textAlign: "center" }}>
      <Avatar src={profile.avatar_url} alt={profile.login} sx={{ width: 112, height: 112 }} />
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>{profile.name ?? profile.login}</Typography>
        <Typography variant="body2" color="text.secondary">@{profile.login}</Typography>
      </Box>
      {profile.bio && <Typography variant="body1" sx={{ maxWidth: 480 }}>{profile.bio}</Typography>}
      {profile.location && (
        <Typography variant="body2" color="text.secondary">📍 {profile.location}</Typography>
      )}
    </Box>
  );
}
