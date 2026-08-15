import {
  Box, Button, Card, CardActionArea, CardContent, Checkbox, Chip, FormControl, Grid,
  InputAdornment, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, TextField, Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { GitHubRepo } from "../types/github";
import { languageColor } from "../utils/languages";
import { formatTopic } from "../utils/topics";
import {
  availableLanguages, filterRepos, hasActiveFilters, sortRepos,
  SORT_KEYS, SORT_LABELS, type RepoFilters, type SortKey,
} from "../utils/filters";

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function RepoCard({ repo }: { repo: GitHubRepo }) {
  // Repos with no detected language keep the neutral grey; a language we
  // simply have no entry for gets a generated colour rather than looking
  // like "unknown".
  const color = repo.language ? languageColor(repo.language) : "#8b949e";
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
  aiTechTags: Record<string, string[]> | null;
  filters: RepoFilters;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: SortKey) => void;
  onLanguagesChange: (languages: string[]) => void;
  onToggleTopic: (topic: string) => void;
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
}

export function RepoGrid({
  repos, aiTechTags, filters, onSearchChange, onSortChange,
  onLanguagesChange, onToggleTopic, onToggleTag, onClearAll,
}: Props) {
  const visible = sortRepos(filterRepos(repos, filters, aiTechTags), filters.sort);
  const filtered = hasActiveFilters(filters);
  const languages = availableLanguages(repos);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Repositories{" "}
        <Typography component="span" variant="body2" color="text.secondary">
          ({filtered ? `${visible.length} of ${repos.length}` : repos.length})
        </Typography>
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search name or description"
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
            htmlInput: { "aria-label": "Search repositories" },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="language-filter-label">Language</InputLabel>
          <Select
            labelId="language-filter-label"
            multiple
            value={filters.languages}
            onChange={(e) =>
              onLanguagesChange(
                typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value,
              )
            }
            input={<OutlinedInput label="Language" />}
            renderValue={(selected) => selected.join(", ")}
          >
            {languages.map((lang) => (
              <MenuItem key={lang} value={lang}>
                <Checkbox size="small" checked={filters.languages.includes(lang)} />
                <ListItemText primary={lang} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel id="sort-label">Sort</InputLabel>
          <Select
            labelId="sort-label"
            value={filters.sort}
            label="Sort"
            onChange={(e) => onSortChange(e.target.value as SortKey)}
          >
            {SORT_KEYS.map((key) => (
              <MenuItem key={key} value={key}>{SORT_LABELS[key]}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filtered && (
        <Box
          role="group"
          aria-label="Active filters"
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mb: 2 }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Filtering by:</Typography>
          {filters.topics.map((topic) => (
            <Chip key={`topic-${topic}`} size="small" color="primary" label={formatTopic(topic)} onDelete={() => onToggleTopic(topic)} />
          ))}
          {filters.tags.map((tag) => (
            <Chip key={`tag-${tag}`} size="small" color="primary" label={tag} onDelete={() => onToggleTag(tag)} />
          ))}
          {filters.languages.map((lang) => (
            <Chip
              key={`lang-${lang}`}
              size="small"
              label={lang}
              onDelete={() => onLanguagesChange(filters.languages.filter((l) => l !== lang))}
              sx={{ bgcolor: `${languageColor(lang)}33`, borderColor: languageColor(lang) }}
              variant="outlined"
            />
          ))}
          {filters.search.trim() && (
            <Chip size="small" variant="outlined" label={`"${filters.search.trim()}"`} onDelete={() => onSearchChange("")} />
          )}
          <Button size="small" onClick={onClearAll} sx={{ textTransform: "none", ml: 0.5 }}>Clear all</Button>
        </Box>
      )}

      {visible.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, border: "1px dashed #30363d", borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No repositories match these filters.
          </Typography>
          <Button size="small" onClick={onClearAll} sx={{ textTransform: "none" }}>Clear all filters</Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {visible.map((repo) => (
            <Grid key={repo.id} size={{ xs: 12, sm: 6 }}>
              <RepoCard repo={repo} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
