# GitHub Portfolio Insights

A static dashboard of the public GitHub repositories of
[@calemccammon](https://github.com/calemccammon), built with React, TypeScript, Vite and Material UI.
At build time a script fetches repository data with the GitHub CLI and merges it with hand-written
project write-ups and technology tags. GitHub Actions deploys the result to GitHub Pages.

Live site: [calemccammon.github.io/github-portfolio-insights](https://calemccammon.github.io/github-portfolio-insights)

## Sections

| Section | Contents |
|---|---|
| Header | Name, GitHub link and a short introduction |
| Selected projects | Four to six projects, each with a summary, two or three specific facts, and links |
| Languages over time | Bubble chart: each repository at its creation date, in the row of every language that makes up at least 10% of its code |
| Language distribution | Doughnut chart by bytes of code or by number of repositories; click a slice to filter |
| Technologies | Tags per repository, grouped by area; click a tag to filter |
| Repository grid | All public repositories that are not forks, with search, a language filter and sorting |

The header text, the project write-ups and the tags are not generated. They live in
[`src/data/content.json`](src/data/content.json), and [`src/data/README.md`](src/data/README.md)
explains how to write them: who reads the page, what each field is for, and how to check a
claim before repeating it.

## Filtering

Technology tags and doughnut slices filter the repository grid. The active filters are kept in
the query string, so a filtered view can be linked or bookmarked:

```
?tag=Kafka,Dagster&sort=name     repos tagged with both Kafka and Dagster, sorted by name
?lang=Java                       the Java repos
```

Tags combine with AND, so each tag you add narrows the results. Languages combine with OR,
because a repository has only one primary language and an AND of two languages would always
be empty. The Language drop-down does the same as clicking a doughnut slice, from the keyboard.

## Tech stack

| Layer | Tool |
|---|---|
| Framework | React 19, TypeScript, Vite |
| UI | Material UI 9 |
| Charts | Chart.js and react-chartjs-2, loaded lazily |
| Data fetching | GitHub CLI (`gh api`) |
| Page content | Written by hand (drafted with Claude), committed as `src/data/content.json` |
| Testing | Vitest and Testing Library |
| Hosting and CI | GitHub Pages, GitHub Actions |

## Local development

You need the [GitHub CLI](https://cli.github.com/) installed and logged in.

```bash
npm install
npx tsx scripts/fetch-github-data.ts   # fetch GitHub data and merge in the page content
npm run dev                            # dev server
```

Then open [http://localhost:5173/github-portfolio-insights/](http://localhost:5173/github-portfolio-insights/).

## How it works

1. `scripts/fetch-github-data.ts` calls `gh api` for the profile, the repositories and each
   repository's language bytes.
2. It reads `src/data/content.json` and merges in the introduction, the project write-ups and
   the tags, leaving out anything about a repository that no longer exists.
3. It writes `public/data/github-stats.json`, which is gitignored.
4. Vite builds the site, and `App.tsx` loads that JSON file at run time.

The written content is committed rather than generated during the build. It was drafted with
Claude from each repository's README and code, following `src/data/README.md`, then reviewed.
It needs changing only when the repositories change, so the build needs no model provider or
API key, every deploy from the same commit has the same text, and wording changes show up in
`git diff`.

The tests check the structure of `content.json` (`src/utils/content.ts`), so a malformed edit
fails before it is deployed. If the file is missing or cannot be parsed at build time, the
script leaves out the hand-written sections and the rest of the dashboard still builds.

## CI/CD

`.github/workflows/deploy.yml` runs on pushes to `main`, on pull requests to `main`, and by hand:

```
npm test                 must pass before anything is deployed
fetch-github-data.ts     gh CLI with the workflow's GITHUB_TOKEN, the only credential needed
npm run build
upload-pages-artifact, deploy-pages
```

Pull requests run only the tests.

## Testing

```bash
npm test             # run once
npm run test:watch   # watch mode
```

The tests cover the filter logic (`filterRepos`, `sortRepos`, reading and writing the query
string), the rules for `content.json` (`contentProblems`, also run against the committed file),
utility functions (`languageColor`, `tagUsage`) and component behaviour (empty data, rendering,
chip counts, active-filter state). Two behaviours that would break without any visible error
each have their own test: tags combining with AND while languages combine with OR, and the
stars sort breaking ties by most recent push.

## Language distribution: bytes or repositories

The doughnut switches between bytes of code and repositories per primary language. Byte counts
favour verbose languages and large generated or vendored files, while the repository count
gives every project the same weight. The two often disagree, and showing only bytes would
overstate whichever language produces the most text.
