# Roadmap

The page started as a claude.ai artifact and went through three versions there.
This repo makes GitHub the home of the code while the data stays in the
artifact's shared database.

| # | Step | Status |
|---|------|--------|
| 1 | Scaffold: repo, instructions, the v3 page with personal details removed | done |
| 2 | Schema: `docs/schema.md` from the live data, fictional `sample-data.json` | done |
| 3 | Data layer: one store interface in the page (artifact database now), plus a demo mode that loads `sample-data.json` for local preview | done |
| 4 | First deploy from the repo to the existing artifact | done |
| 5 | Backups: a scheduled job that copies the `jobs` collection to a dated JSON file, keeping the last 30 | done |
| 6 | Indeed parser, built against real pasted postings | done (search results and a job's own page) |
| 7 | README with screenshots from sample data; review history, then make the repo public | done: public since 2026-10-23 |

## Deploys

| Date | Commit | Artifact version | Notes |
|---|---|---|---|
| 2026-10-15 | d57de4a | 5 | First deploy from the repo: store interface, demo mode, personal details removed. Job data checked identical before and after. |
| 2026-10-15 | c7b14a1 | 6 | Indeed pastes (search-results layout) and duplicate checks across sites. Job data checked identical before and after. |
| (not logged) | f7e8dad | 1792095823-dee4 | Indeed share links and the job's own page. Found live on 2026-10-22, matching `main` byte for byte. |
| 2026-10-24 | 99da90f | 7 (1792880659-141d) | v4 and the Seed Change name: Get started (resume import into `profile/me`) and Help me apply (`form` on jobs). Additive fields, no migration. Job data checked identical before and after (132 jobs). |

## Next: v4 (queued 2026-10-23)
Rule for all of it: the main screen stays as it is. New features live behind
one optional "Get started" flow and a button on each job, so features people
rarely use don't clutter the page.

1. **Onboarding (optional, skippable).** Import an existing resume (PDF, Word
   or pasted text) into a profile that Claude uses for fit scores, letters and
   answers. At the end it offers the polisher and the practice interview.
2. **Resume polisher.** Suggestions for one target job or in general. Keeps
   versions and saves a PDF.
3. **Practice interview (optional).** A simulated HR or work-placement
   interview that draws out experience the resume misses and adds it to the
   profile.
4. **Application assist.** A "Help me apply" button on each job, for company
   sites that have their own long forms and questions. Claude drafts answers
   from the profile. With the browser extension it can fill the form for the
   user to review. It never submits by itself.
5. **A better name.** Done: **Seed Change** (decided in issue #2). The repo,
   the database collection (`jobs`), the browser storage keys and the backup
   file names keep their old names, so nothing existing has to move.

### v4 status

First slice deployed 2026-10-24 (see Deploys); the resume polisher is built
and not deployed yet.

| # | Built | Still to do |
|---|---|---|
| 1 | Get started: paste a resume or pick a PDF or Word file, check the fields read from it, save the profile (`profile/me`). Skippable at every step; opens by itself once when there is no profile. Its last step offers Resume versions. | Offer the practice interview at the end, once it exists. |
| 2 | Resume versions (Profile, or Tailor resume on a job's Letter tab): versions in the `resumes` collection, never changed once saved; Claude polishes one in general or for a job and saves a new version with notes; edits save as a new version; any version saves as a PDF. Backups carry the versions (`--resumes`). | Suggestions to accept one at a time, instead of a whole new version. A side-by-side view of what changed. |
| 3 | Nothing yet. | All of it. |
| 4 | Help me apply tab: paste a company form's questions, saved on the job as `form`; Claude drafts each `answer`, shown with a Copy button. | Filling the form through the browser extension for the user to review. |
| 5 | Renamed. | Nothing. |

Before deploying the polisher:
- No migration: `resumes` is a new collection, and the page reads an empty
  one as "no versions yet".
- Have the daily backup task list `resumes` too and pass
  `--resumes <listing>/resumes` (see Backups in AGENTS.md).

## Later
- A hosted store (for example Firestore, or Azure Static Web Apps with Cosmos DB)
  so the app can run outside claude.ai and install on a phone. The page's
  database code already follows a Firestore-style API, so this is mostly a new
  store behind the step 3 interface.
