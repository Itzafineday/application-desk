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
| 6 | Indeed parser, built against real pasted postings | planned |
| 7 | README with screenshots from sample data; review history, then make the repo public | planned |

## Deploys

| Date | Commit | Artifact version | Notes |
|---|---|---|---|
| 2026-10-15 | d57de4a | 5 | First deploy from the repo: store interface, demo mode, personal details removed. Job data checked identical before and after. |

## Later
- A hosted store (for example Firestore, or Azure Static Web Apps with Cosmos DB)
  so the app can run outside claude.ai and install on a phone. The page's
  database code already follows a Firestore-style API, so this is mostly a new
  store behind the step 3 interface.
