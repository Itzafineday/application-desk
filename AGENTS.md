# Application Desk: instructions for agents working on this repo

A job application tracker in one HTML page: paste a posting, track its status,
score the fit, draft a cover letter and save it as a PDF, and keep a question
thread per job. No build step.

This repo is meant to be public. Everything committed here is permanent.

## Never commit
- The owner's name, contact details, employers, or the companies they applied to.
- Real job data of any kind: postings, letters, notes, exports, backups.
- Local paths that contain a username, machine names, secrets or tokens.

## Before every commit
- Turn the pre-commit hook on once per clone: `git config core.hooksPath .githooks`
  (needs gitleaks). Never bypass it with `--no-verify`.
- Put private words (names, companies, emails) in `.git/info/private-terms`,
  one per line. The hook blocks any added line that contains one.
- Read the staged diff against the list above.

## How it runs
- `public/index.html` is published as a claude.ai artifact with the `db` and
  `downloads` capabilities. Jobs live in the artifact's shared database,
  collection `jobs`, one document per job (document id = job id). The page
  subscribes to the collection, so edits made by Claude show up live.
- Opened outside claude.ai, the page falls back to "This browser only" and
  works from a localStorage cache.
- Deploying means publishing `public/index.html` to the existing artifact URL.
  The URL is in the owner's local notes, not in this repo. Deploy only with the
  owner's OK, and leave the stored capabilities as they are.
- Change the page here, never in the published copy: the next deploy
  overwrites anything edited there.

## Layout
- `public/index.html`: the whole app (styles, markup, script).
- `docs/schema.md`: the data model. Update it with any field change.
- `docs/roadmap.md`: build order and status.
- `sample-data.json`: fictional jobs for demos and tests.

## Working with the live data
Only Claude, signed in as the owner, can reach the shared database (claude.ai
artifact tools). Other agents work on code and sample data only.
- Read `docs/schema.md` before changing any field.
- Never delete a job. Closing one is a status change to `closed`.
- Questions: append `{ id, ts, who: "claude", text }` to `questions`. Never
  edit, remove or reorder existing entries, and leave `qSeen` alone (the page
  sets it when the owner reads the thread).
- Pin every write to the document version you read, so a change made in the
  page at the same time is not overwritten.
- Before changing more than a few jobs, save a backup of the `jobs` collection
  to a dated JSON file outside the repo.

## Conventions
- Small commits, one concern each, imperative mood ("Add Indeed parser").
- Keep the page's current style (plain ES5 functions, no framework) unless a
  refactor is the point of the change.
- Personal instructions (paths, artifact URL, cover-letter rules) live in
  `CLAUDE.local.md`, which is gitignored.
- Other agents (Copilot CLI, Antigravity CLI) work on their own branch; Claude
  reviews. Never push, merge to a public branch, or deploy without the owner's OK.
