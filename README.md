# GitHub Portfolio Insights

A static dashboard built with **React + TypeScript + Vite** and **Material UI** that visualizes the GitHub portfolio of [@calemccammon](https://github.com/calemccammon). Live repository data is fetched at build time using the **GitHub CLI**, merged with hand-maintained project write-ups and technology tags, then deployed automatically to **GitHub Pages**.

🌐 **Live site:** [calemccammon.github.io/github-portfolio-insights](https://calemccammon.github.io/github-portfolio-insights)

---

## Dashboard Sections

| Section | Description |
|---|---|
| **Header** | Name, GitHub link, and a short introduction |
| **Selected projects** | Four to six projects, each with a summary, two or three specific facts, and links |
| **Languages over time** | Bubble chart — each repository at its creation date, in the row of every language with at least 10% of its code |
| **Language distribution** | Doughnut chart — by bytes of code or by repository count — click to filter |
| **Technologies** | Tags per repository, grouped by area — click to filter |
| **Repository grid** | All non-forked public repos, with search, language filter, and sort |

The header text, the project write-ups and the tags are not generated. They live in
[`src/data/content.json`](src/data/content.json), and [`src/data/README.md`](src/data/README.md)
is the guide for writing them: who reads the page, what each field is for, and how to check a
claim before repeating it.

---

## Filtering

The technology chips and the doughnut are controls. Selecting them narrows the repository
grid, and the active filters are mirrored into the query string, so any filtered view can be
linked or bookmarked:

```
?tag=Kafka,Dagster&sort=name     → repos tagged with both Kafka AND Dagster
?lang=Java                       → the Java repos
```

Tags combine with **AND**, so each chip clicked narrows the results. Languages combine with
**OR**, because a repo has exactly one primary language and ANDing two of them could only ever
return nothing. Clicking a doughnut slice filters by that language; the Language dropdown does
the same thing from the keyboard.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| UI | Material UI v9 |
| Charts | Chart.js + react-chartjs-2 (lazy-loaded) |
| Data fetching | GitHub CLI (`gh api`) |
| Page content | Written by hand (drafted with Claude), committed as `src/data/content.json` |
| Testing | Vitest + Testing Library |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

---

## Local Development

**Prerequisites:** [GitHub CLI](https://cli.github.com/) installed

```bash
# Install dependencies
npm install

# Fetch live GitHub data and merge in the committed page content
npx tsx scripts/fetch-github-data.ts

# Start dev server
npm run dev
```

Open [http://localhost:5173/github-portfolio-insights/](http://localhost:5173/github-portfolio-insights/).

---

## How It Works

1. `scripts/fetch-github-data.ts` calls `gh api` for profile, repos, and language bytes
2. It reads `src/data/content.json` and merges in the introduction, the featured project
   write-ups, and the per-repo tags, leaving out anything that refers to a repository that no
   longer exists
3. The script writes `public/data/github-stats.json` (gitignored)
4. Vite builds the site; `App.tsx` fetches the JSON at runtime
5. On push to `main`, GitHub Actions runs tests, then fetches data and deploys to `gh-pages`

**The written content is committed, not generated at build time.** It was drafted with Claude
from each repository's README and code, following `src/data/README.md`, then reviewed and
committed. It only goes stale when the repositories change, which is far less often than this
pipeline runs, so the build needs no model provider and no API key, deploys are reproducible,
and every change to the wording is reviewable in `git diff`.

The test suite validates the structure of `content.json` (`src/utils/content.ts`), so a
malformed edit fails before deploy. If the file is missing or unparseable at build time, the
hand-written sections are omitted and the rest of the dashboard builds normally.

`gh` uses the workflow's `GITHUB_TOKEN` — the only credential the pipeline needs.

---

## CI/CD

The workflow (`.github/workflows/deploy.yml`) triggers on push to `main`:

```
push to main
  → npm test               (Vitest — must pass before deploy)
  → fetch-github-data.ts   (gh CLI + committed page content; GITHUB_TOKEN only)
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

Tests cover the filter logic (`filterRepos`, `sortRepos`, URL round-tripping), the rules for
`content.json` (`contentProblems`, run against the committed file), utility functions
(`languageColor`, `tagUsage`), and component behaviour (null guards, rendering, chip counts,
active-filter state).

The AND/OR asymmetry between facets and the stars-tie-broken-by-recency sort are both
easy to regress and invisible when they break, so each is pinned by a named test.

---

## Language Distribution: two lenses

The doughnut toggles between **bytes of code** and **repositories per primary language**.
Byte counts reward verbose languages and large generated or vendored files; the
per-repository count weights every project equally. They disagree, which is the point —
neither one is the whole picture, and showing only the first would overstate whichever
language happens to produce the most text.

