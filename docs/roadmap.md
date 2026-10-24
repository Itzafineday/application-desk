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

### v4 status (first slice built 2026-10-23, not deployed)

| # | Built | Still to do |
|---|---|---|
| 1 | Get started: paste a resume or pick a PDF or Word file, check the fields read from it, save the profile (`profile/me`). Skippable at every step; opens by itself once when there is no profile. | Offer the polisher and the practice interview at the end, once they exist. |
| 2 | Nothing yet. The profile keeps the imported resume text (`resume`) to start from. | All of it. |
| 3 | Nothing yet. | All of it. |
| 4 | Help me apply tab: paste a company form's questions, saved on the job as `form`; Claude drafts each `answer`, shown with a Copy button. | Filling the form through the browser extension for the user to review. |
| 5 | Renamed. | Nothing. |

Before the first v4 deploy:
- Check that the two readers load in the published page: pdf.js 3.11.174 and
  mammoth 1.11.0 from cdnjs. They load only when a file is picked, and the
  page says so if they don't; pasting text always works.
- `scripts/pack-backup.js` now packs the profile when given `--profile`, but
  the daily backup task on the owner's machine still lists only `jobs`. Have
  it list `profile` too and pass `--profile <listing>/profile` (see Backups
  in AGENTS.md).
- Get started will open once for the owner, since there is no profile yet.

## Later
- A hosted store (for example Firestore, or Azure Static Web Apps with Cosmos DB)
  so the app can run outside claude.ai and install on a phone. The page's
  database code already follows a Firestore-style API, so this is mostly a new
  store behind the step 3 interface.
