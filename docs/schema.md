# Data schema

The schema is defined by the live data and by `normalize()` (jobs) and
`normProfile()` (the profile) in `public/index.html`. Change both together,
and record the change here.

## Where the data lives

- **Shared database** (the record): the artifact's `db`, collection `jobs`,
  one document per job. The document id is the job id. The page subscribes to
  the whole collection (up to 1,000 documents). The profile is one more
  document, `profile/me` (collection `profile`, id `me`), and each resume
  version is a document in the `resumes` collection. The page subscribes to
  both as well.
- **Browser cache**: `localStorage["appdesk.v3.cache"]` holds
  `{ version: 3, jobs, profile, resumes }` so the page can draw before the database
  answers. It is never the record.
- **Get started**: `localStorage["appdesk.v4.getstarted"] = "skipped"`
  remembers that Get started was skipped in this browser, so it doesn't open
  by itself again. It is not data and is never exported.
- **Demo** (outside claude.ai): jobs, the profile and resume versions come from
  `public/sample-data.json` and stay in memory. Nothing is written to the
  cache.
- **Legacy**: `localStorage["appdesk.v2"]` is the v2 record. v3 reads it once,
  copies any missing jobs into the database, then sets
  `localStorage["appdesk.v3.migrated"] = "1"`.

Platform limits: a document can be at most 256 KiB (the largest job today is
about 15 KB). The number of documents per collection and per database is
capped; when the cap is hit, new jobs can't be added but existing ones can
still be edited, and the page shows "The job list is full".

## Job

| Field | Type | Notes |
|---|---|---|
| `id` | string | Same as the document id. The page builds it as a company slug (up to 26 characters) plus `-` and 7 random base-36 characters, for example `acme-k3j9x2q`. Jobs Claude adds may use a readable slug such as `acme-sysadmin`. Older documents may lack the field; the page fills it from the document id. |
| `company` | string | Required. Defaults to `"Unknown company"`. |
| `title` | string | Required. Defaults to `"Untitled role"`, or `"Details to fetch"` when only a link was pasted. |
| `status` | enum | `queued`, `working`, `applied`, `interview`, `offer`, `closed`. Anything else is read as `queued`. Jobs are never deleted by agents; closing is a status change. |
| `fit` | number or null | Fit score 0–100. `null` means not scored yet (a queued job with no score counts as "To score"). 85 or more shows green, under 60 grey. |
| `band` | string | Pay range as shown on the posting, free text: `"$95,000 - $120,000"`, `"$3,400 biweekly (~$88k/yr)"`, `"$30 - $38 an hour (~$62k-$79k/yr)"`, `"not posted"`, or `""`. Sorting uses the first number in the text (values under 1,000 are read as thousands). |
| `location` | string | Free text, usually `"City, BC"`. |
| `url` | string | Link to the posting. Indeed links are stored as the job's own page (`/viewjob?jk=<key>`), even when pasted from search results. Duplicate check when adding: the same URL, the same LinkedIn job id or Indeed job key, or the same company and title (the same posting found on another site). |
| `source` | string | Free text: `"LinkedIn"`, `"Indeed"`, `"LinkedIn Easy Apply"`, a job board, or a recruiter. The parser sets `LinkedIn` or `Indeed` from the URL. |
| `posted` | string | `YYYY-MM-DD`. Set from "3 days ago" style text when pasting, otherwise the day it was added. May be missing. |
| `applied` | string or null | `YYYY-MM-DD`. Set to today the first time status becomes `applied`. |
| `notes` | string | The Brief tab: assessment and notes. |
| `posting` | string | Full posting text, kept in case the posting is taken down. For an Indeed or LinkedIn paste only the job's own text is kept: not Indeed's result list, LinkedIn's company profile and "More jobs", or either site's chrome and footer. Empty on a job that isn't closed shows the "no text" flag. |
| `letter` | string | Cover letter as plain text (format below). |
| `questions` | array | Question thread (format below). |
| `qSeen` | string or null | The `id` of the last thread message the owner has seen. Set by the page when the Questions tab opens. Agents leave it alone. |
| `created` | string | ISO 8601 timestamp, set by the page for jobs added since v3. Optional. |
| `form` | array | Help me apply: the questions of the company's own application form, with Claude's draft answers (format below). Added in v4. |

Documents written by Claude may carry only some fields. `normalize()` fills
the gaps: `questions`/`form` → `[]`, `fit` → `null`,
`letter`/`notes`/`posting` → `""`, `applied`/`qSeen` → `null`.

### Question thread entries

```json
{ "id": "q-k3j9x2q", "ts": "2026-10-14", "who": "user", "text": "Is the band negotiable?" }
```

- `who`: `"user"` (the owner, asking) or `"claude"` (answering).
- `ts`: `YYYY-MM-DD`.
- `id`: unique within the job. The page uses `"q-"` plus 7 random base-36
  characters.
- A thread is **open** when its last entry is from `user`, and has a **new
  answer** when its last entry is from `claude` and its `id` is not `qSeen`.
- Append only. Never edit, remove or reorder existing entries.
- The v3 page in claude.ai stored the owner's role under their first name
  instead of `"user"`. Any such entries need to be rewritten as `"user"`
  before the first deploy from this repo.

### Application form entries

```json
{ "id": "f-m2v8q1c", "ts": "2026-10-23", "text": "Why do you want to work here? (max 1000 characters)", "answer": "" }
```

- `text`: one question, as pasted in the Help me apply tab. The page splits a
  paste into one entry per line and leaves out list numbers, required marks,
  buttons, file pickers and yes/no choices. A length limit on its own line
  ("0/1000", "Maximum 250 words") is added to the question above it as
  `(max 1000 characters)`.
- `answer`: plain text, `""` until Claude drafts one. The page shows it under
  the question with a Copy button.
- `id`: unique within the job, `"f-"` plus 7 random base-36 characters.
  `ts`: `YYYY-MM-DD`, the day the question was added.
- Claude fills in `answer`, from the profile and the posting, and may append
  entries it is asked to. It never removes or reorders entries, and never
  submits a form or anything else on a company site: the owner copies each
  answer into the form and sends it.
- The owner can remove an entry in the page.

### Cover letter text

The PDF layout reads structure from the plain text:

- Blocks are separated by a blank line.
- First block: line 1 is the writer's name (set large and bold, and also used
  in the PDF filename), line 2 is the contact line, then a rule is drawn.
- A short line (under 62 characters, not ending in `.` or `;`) stays on its own
  line, which suits the date, addressee and sign-off. A line starting with `Re:`
  is bold.
- Longer lines wrap as paragraphs.
- The PDF tries three progressively tighter type settings so the letter fits
  on one page before spilling onto a second.

## Profile

One document, `profile/me`, describing the person applying. Get started
fills it from a resume; Claude reads it for fit scores, letters and answers
to application forms, and may add to it. There is no profile until one is
saved: the page treats a missing document as "no profile yet".

| Field | Type | Notes |
|---|---|---|
| `name` | string | The person's name, as the resume gives it. A resume's all-caps name is stored in title case. |
| `headline` | string | One line: the title or summary line under the name. |
| `skills` | string | Plain text, one group per line. |
| `experience` | string | Plain text. Each role's lines, with bullets as `- `, and a blank line between roles. |
| `resume` | string | The whole resume as imported (pasted, or read from a PDF or Word file), up to 60,000 characters, so nothing the fields above leave out is lost. |
| `updated` | string | ISO 8601 timestamp of the last save from the page. |

All fields are optional; `normProfile()` reads a missing text field as `""`. The
page writes only the fields that changed (a merge, creating the document if
there is none), so fields Claude adds are kept. Claude should pin writes to
the version it read, as for jobs, and leave `resume` alone: it is the source
text the other fields came from.

## Resume versions

The resume polisher's versions: collection `resumes`, one document per
version, document id = version id. The resume imported by Get started is
not a version; it stays in the profile's `resume` field and counts as the
original. A version is never changed once saved: polishing it, or editing it
in the page, saves a new one.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Same as the document id: `"r-"` plus 7 random base-36 characters. |
| `created` | string | ISO 8601 timestamp. Versions are listed in this order. |
| `label` | string | A short name: `"General polish"`, `"For Acme Example"`, `"Edited"`. |
| `job` | string | The id of the job it was tailored for, or `""` for a general version. |
| `base` | string | The version it was made from: a version id, or `"profile"` for the imported resume. |
| `by` | string | `"claude"` or `"user"` (edited and saved in the page). |
| `text` | string | The whole resume as plain text. |
| `notes` | string | Claude's notes: what changed and why, and anything worth adding that it can't know. `""` for the owner's own versions. |

Claude adds a version with ArtifactData `set` on a new id. It never changes or
deletes a version, and never changes the profile's `resume` while polishing.

## Export file

"Export backup" saves, and "Import" reads, this shape:

```json
{
  "version": 3,
  "exported": "2026-10-14",
  "profile": { "name": "", "headline": "", "skills": "", "experience": "", "resume": "" },
  "resumes": [ ],
  "jobs": [ ]
}
```

- `version` is the schema version (v2 exports used `2`, v1 had only `version`
  and `jobs`). It is not a save counter.
- `profile` is the profile document (above), or `null` when there is none.
  `scripts/pack-backup.js` writes it from a listing of `profile` when given
  `--profile`, and `null` otherwise. Exports from before v4 carry
  `{ "name": "", "contact": "" }` there instead; Import ignores a profile
  without a headline, skills, experience or resume text. An imported profile
  replaces the fields it has. The letter text still holds the writer's name
  and contact line for the PDF.
- `resumes` holds the resume versions (above). Exports from before the
  polisher have none. Import adds the versions not already there, by `id`.
- Import merges jobs by `id`: a job with a matching id is replaced, others are added.

`public/sample-data.json` uses the export shape, with fictional data only.
