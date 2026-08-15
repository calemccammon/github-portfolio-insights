# GitHub Portfolio Insights

A static dashboard built with **React + TypeScript + Vite** and **Material UI** that visualizes the GitHub portfolio of [@calemccammon](https://github.com/calemccammon). Live repository data is fetched at build time using the **GitHub CLI**, merged with committed AI-authored commentary, then deployed automatically to **GitHub Pages**.

🌐 **Live site:** [calemccammon.github.io/github-portfolio-insights](https://calemccammon.github.io/github-portfolio-insights)

---

## Dashboard Sections

| Section | Description |
|---|---|
| **Hero** | Avatar, name, bio, and location |
| **AI Portfolio Analysis** | 2-paragraph narrative written by Claude from repo metadata |
| **Tech Adoption Timeline** | Bubble chart — when each language first appeared in the portfolio |
| **Language Distribution** | Doughnut chart — byte counts per language with percentages |
| **Topics** | All GitHub topics applied across repos, with repo tooltips |
| **Patterns & Libraries** | Frameworks, patterns, and tools Claude extracted per repository |
| **Repository Grid** | All non-forked public repos, sorted by last push |

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| UI | Material UI v9 |
| Charts | Chart.js + react-chartjs-2 |
| Data fetching | GitHub CLI (`gh api`) |
| AI commentary | Claude — authored once, committed as `src/data/ai-content.json` |
| Testing | Vitest + Testing Library |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

---

## Local Development

**Prerequisites:** [GitHub CLI](https://cli.github.com/) installed

```bash
# Install dependencies
npm install

# Fetch live GitHub data and merge in the committed AI content
npx tsx scripts/fetch-github-data.ts

# Start dev server
npm run dev
```

Open [http://localhost:5173/github-portfolio-insights/](http://localhost:5173/github-portfolio-insights/).

---

## How It Works

1. `scripts/fetch-github-data.ts` calls `gh api` for profile, repos, and language bytes
2. It reads `src/data/ai-content.json` and merges in:
   - The portfolio narrative
   - Per-repo tech tags, filtered to repositories that still exist
3. The script writes `public/data/github-stats.json` (gitignored)
4. Vite builds the site; `App.tsx` fetches the JSON at runtime
5. On push to `main`, GitHub Actions runs tests, then fetches data and deploys to `gh-pages`

**The AI sections are authored, not generated at build time.** Claude wrote the narrative
and the per-repo tech tags with the repository list, descriptions, topics, and available
READMEs in context; the result was reviewed and committed to `src/data/ai-content.json`.
The commentary only goes stale when the portfolio itself changes, which is far less often
than this pipeline runs — so regenerating it on every deploy would spend an API call to
recompute an identical answer. Refreshing it is a deliberate step, not a build dependency.

The practical consequences: the build needs no model provider, no API key, and no
inference budget; deploys are deterministic and reproducible; and the commentary is
reviewable in `git diff` like any other content. If the file is missing or malformed the
two AI sections are omitted and the rest of the dashboard builds normally.

`gh` uses the workflow's `GITHUB_TOKEN` — the only credential the pipeline needs.

---

## CI/CD

The workflow (`.github/workflows/deploy.yml`) triggers on push to `main`:

```
push to main
  → npm test               (Vitest — must pass before deploy)
  → fetch-github-data.ts   (gh CLI + committed AI content; GITHUB_TOKEN only)
  → npm run build
  → actions/upload-pages-artifact + actions/deploy-pages (native GitHub Pages)
```

Tests also run on pull requests (without deploying).

---

## Testing

```bash
npm test          # run once
npm run test:watch  # watch mode
```

Tests cover utility functions (`formatTopic`, `aggregateTopics`) and component behaviour (null guards, rendering, chip counts).

