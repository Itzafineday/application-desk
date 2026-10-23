# Seed Change: instructions for agents working on this repo

Seed Change (formerly Application Desk; the repo keeps the old name) is a job
application tracker in one HTML page: paste a posting, track its status,
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
- All data access goes through the store interface in the page's "stores"
  section (`start`, `update`, `put`, `remove`). Never call the database
  API anywhere else; a new backend is a new store.
- Outside claude.ai there is no `window.claude`, so the page runs as a demo:
  it loads `public/sample-data.json`, keeps edits in memory, and saves files
  through the browser. Preview it by serving `public/` over HTTP (see the
  README); opened straight from disk, the sample data can't load.
- Inside claude.ai, if the database isn't available, the page shows "This
  browser only" and works from its localStorage cache.
- Change the page here, never in the published copy: the next deploy
  overwrites anything edited there.

## Deploying
Deploying means publishing `public/index.html` to the existing artifact URL,
which is in the owner's local notes, not in this repo. Only Claude can do it,
and only with the owner's OK. Commit first, then:
1. Read the live artifact. If its version isn't the one the last deploy
   produced, someone changed the published copy: compare it with `main` and
   bring any changes into the repo before going on.
2. Save a backup of the `jobs` collection to a dated JSON file outside the repo.
3. If the deploy changes the data model, migrate the documents first (pinned
   writes) and update `docs/schema.md`.
4. Publish `public/index.html` to the artifact URL. Leave out `capabilities`
   so the stored ones (`db`, `downloads`) carry forward.
5. List `jobs` again and confirm it matches the backup, then open the page for
   the owner to check it says "Synced with Claude".
6. Record the commit and artifact version in `docs/roadmap.md` (Deploys).

## Layout
- `public/index.html`: the whole app (styles, markup, script).
- `docs/schema.md`: the data model. Update it with any field change.
- `docs/roadmap.md`: build order and status.
- `public/sample-data.json`: fictional jobs and profile for the demo and for
  tests.
- `tests/`: tests for the paste parser and the resume reader, on fictional
  text (`node --test`, no install needed). Run them before committing any
  change to either, and add a fixture for each new layout. Fixtures must be
  invented, never a real posting or a real resume.
- `scripts/pack-backup.js`: turns a listing of the `jobs` collection into a
  dated export file and keeps the newest 30 (see Backups).

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

## Backups
A daily scheduled Claude task, on one machine only, lists the `jobs`
collection into a fresh temporary folder (read-only), then runs
`node scripts/pack-backup.js <listing>/jobs <backup-folder> --keep 30`. The
script writes `application-desk-backup-<date>.json` in the export shape, so
the page's Import can restore it. It refuses to write when the listing is
empty or unreadable, warns when the job count drops by more than a fifth, and
only rotates files with exactly that name. Run it from one machine: two
machines writing the same synced folder create conflict copies.

## Conventions
- Small commits, one concern each, imperative mood ("Add Indeed parser").
- Keep the page's current style (plain ES5 functions, no framework) unless a
  refactor is the point of the change.
- Personal instructions (paths, artifact URL, cover-letter rules) live in
  `CLAUDE.local.md`, which is gitignored.
- Other agents (Copilot CLI, Antigravity CLI) work on their own branch; Claude
  reviews. Never push, merge to a public branch, or deploy without the owner's OK.
