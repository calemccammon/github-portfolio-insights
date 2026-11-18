# Writing the page content

`content.json` holds everything on the page that is written by hand rather than fetched from
GitHub: the name, the introduction, the featured project write-ups, and the technology tags.
This guide is the brief for whoever updates it, whether that is a person or a model. Read all of
it before changing the file.

## Who reads the page

The page is linked from job applications. The reader is a recruiter or an engineer screening a
candidate. They arrive from a résumé link, they have not seen any of the repositories, and they
will give the page about a minute before deciding whether to open a project.

In that minute they want three things:

1. What kind of work this person does.
2. Which projects are worth opening, and what is in each one.
3. Whether a technology they care about appears, and where.

The introduction answers the first, the featured projects answer the second, and the tags answer
the third. Every sentence in the file should serve one of those. A sentence that the reader could
not act on, or that would be equally true of any portfolio, should be cut.

## Where the facts come from

Write only what the repositories show. For each one, read the whole README, and read the code
where the README is short or missing (several of the older repositories have none). List the
repositories with:

```bash
gh api "/users/calemccammon/repos?per_page=100&sort=updated"
```

Before you repeat a claim, check it at its source:

- **A number** (a test count, a score) must appear in the repository as it is today. Numbers go
  stale, so use few of them, and prefer one that would stay true after another month of commits.
- **A link** must answer `200` and show what its label says. Check it with `curl`.
- **"Live", "deployed", "running"** need a working URL on the day you write it. A README can be
  out of date about its own deployment. If the service does not answer, describe how it is built
  and leave the link out.

If a README and the code disagree, the code is right. Do not smooth over the gap by writing
something vague enough to cover both.

## The fields

### `name`

The name to show at the top. The GitHub profile name is used when this is empty.

### `intro`

Two short paragraphs, under 80 words in total, separated by a blank line. The first says what
kinds of things have been built, naming the things themselves ("a Kotlin-to-Lua compiler") and not
the categories they belong to ("developer tooling"). The second tells the reader how the rest of
the page is organised.

Do not list libraries here. The tags do that, and a paragraph of library names tells the reader
nothing that the tag section does not show better. This is what the previous version did, and it
is the main thing to avoid:

> Pipelines use Airflow, dbt, Dagster, Kafka Streams and Redpanda over PostgreSQL, DuckDB and
> BigQuery. Client work spans Flutter, React Native, Kotlin Multiplatform, Fyne and ratatui.

After reading that, the reader knows which words appear in the repositories and still does not
know what any project does.

### `featured`

Four to six projects, strongest first. Choose a project when it does something a reader could not
guess from its name, when it is finished enough to run, and when it shows a kind of work that the
other featured projects do not. A portfolio of six data pipelines would hide the compiler.

Each entry has:

- `repo`: the repository name, exactly as on GitHub.
- `summary`: one or two sentences saying what the project does, for a reader who has never heard
  of it. Start with what it is. Name the main technologies in passing, because this is the one
  place where they have context.
- `points`: two or three sentences, each a single specific fact about how the project is built or
  what it found. Good points are design decisions with their reason ("duplicate suppression is a
  UNIQUE constraint, so two overlapping runs cannot both send the same alert"), measured results,
  and evidence that the thing works (tests, CI, a deployment). Each point should be something the
  reader could verify by opening the repository.
- `links`: optional extra links, each with a `label` and a `url`. Use these for a live demo, a
  published report, or hosted documentation. The repository link is added automatically.

### `techTags`

A list of tags for every repository, keyed by repository name. The tags fill the Technologies
section and filter the repository list, and the first four appear on each repository's card, so
put the most identifying ones first.

A tag is the name of a technology or technique that a reader might look for: a framework, a
database, a protocol, a named pattern. Test each one by asking whether someone would search a
résumé for it. "Kafka Streams" and "OAuth" pass. "Background Threads", "Score Tracking" and
"Query Filtering" describe what the code does and do not pass.

- Use one spelling for one thing across all repositories, so that the filter groups them: "REST
  API" everywhere, never "REST" in one place and "REST API" in another. Leave version numbers out.
- Leave programming languages out. The language charts and the language filter cover them.
- Tag what the repository uses, and only what you have confirmed it uses.
- An old or small repository can have one tag. Do not pad it.
- No commas in a tag. Tags are comma-separated in the page URL.

### `tagGroups`

The headings in the Technologies section, in display order, each with the tags that belong under
it. Every tag used in `techTags` must appear in exactly one group, and every tag in a group must
be used by at least one repository. Add a group only when several tags do not fit an existing one.

### `updatedAt`

The date you last revised the file.

## How to write it

Write plain statements of fact in complete sentences. The reader is deciding whether to trust the
page, and the fastest way to lose them is prose that sounds like an advertisement.

- Say what the project does, not what it "demonstrates", "showcases" or "highlights", and not what
  its author learned from it.
- Leave out words that grade the work: "robust", "comprehensive", "production-grade", "modern",
  "seamless". If the work is good, the specific fact shows it. If you cannot find the specific
  fact, the adjective was not earned.
- Do not contrast with something nobody proposed ("not just a demo, but..."). Say the positive
  thing directly.
- Prefer the concrete term. "A UNIQUE constraint" is better than "database-level guarantees".
- Use the first person sparingly and only in `intro`. The write-ups are about the projects.

## When to update it

- A repository is added, renamed or deleted: add or fix its `techTags` entry. The fetch script
  prints the repositories that have no tags.
- A featured project changes substantially, or a newer project is stronger than a featured one.
- A link stops working. Re-check every link in the file whenever you edit it.

## Checking the result

```bash
npm test                                # validates the structure of content.json
npx tsx scripts/fetch-github-data.ts    # warns about repositories with no tags
npm run dev                             # read the page as the reader would
```

The tests check the structure only: that every tag is in one group, that featured projects have
tags, that the lengths are within the limits above. They cannot check that a sentence is true or
worth reading. Read the page once from the top, as someone who has never seen the repositories,
before you commit.
