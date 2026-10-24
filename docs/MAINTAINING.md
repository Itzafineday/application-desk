# Maintaining Seed Change: from a report to a release

How bug reports and feature requests get from users to a release, with Claude
doing the legwork and the owner making every decision. The same setup works
for any public app built this way.

```
User: Report a bug  ──►  issue (form)  ──►  Triage (Claude, minutes)
                                                │ plan + labels
Owner: add "approved" label  ◄──────────────────┘
        │
        ▼
Build (Claude) ──► pull request ──► Tests check ──► Owner merges
                                                       │
Owner: Run "Release" ──► release notes + tag ──► comments on fixed issues
        │
        ▼
Owner's page: "deploy Seed Change from main" (AGENTS.md, Deploying)
Users' pages: "Update my Seed Change" (docs/UPDATING.md)
```

## One-time setup

1. **API key.** In the repo, open Settings, then Secrets and variables, then
   Actions, and add a repository secret `ANTHROPIC_API_KEY` (from
   console.anthropic.com). Each triage, build and release run uses it, billed
   per use. To use a Claude subscription instead, run `claude setup-token`
   locally, save the token as `CLAUDE_CODE_OAUTH_TOKEN`, and in the three
   workflows replace `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`
   with `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`.
2. **Claude GitHub App.** It must be installed on the repo (it already is if
   Claude sessions open pull requests here). The build workflow uses it, so
   its pull requests trigger the Tests check.
3. **Notifications.** Watch the repo (All activity, or Custom with Issues and
   Pull requests) so triage comments reach you by email or on your phone.
4. **Ruleset on main** (done): pull request required, Tests must pass, no
   force pushes or deletion.

The labels (`triage`, `ready-for-review`, `approved`, `needs-info`,
`privacy`) are created by the triage workflow the first time it runs.

## Day to day

1. **A report comes in.** People use Report a bug or Suggest a feature in the
   page (click the version next to the name), which opens a GitHub issue form
   with their version filled in. Blank issues are off.
2. **Triage runs within minutes** (`.github/workflows/triage.yml`). Claude
   checks for personal details (asks the reporter to remove them, label
   `privacy`), duplicates (`duplicate`) and missing information
   (`needs-info`). Otherwise it reads the code and posts a plan: the cause,
   3 to 6 steps, how it would be tested, the risk to users' data and the size.
   The issue gets `ready-for-review`. To run triage again, add `triage`.
3. **You decide.** Read the plan. To go ahead, add the `approved` label; to
   change it, comment first, then add the label (the build follows your
   comments too); to decline, close the issue with a short reason.
4. **Claude builds it** (`.github/workflows/build.yml`), only when the repo
   owner adds `approved`. It works on `claude/issue-<n>`, adds tests, runs
   them, and opens a pull request that says "Fixes #<n>" and links it on the
   issue. It never merges, releases, deploys or changes `.github/`.
5. **You merge.** The Tests check must pass first. Ask Claude in a session if
   a change needs work; the pull request is a normal one.
6. **Release when you're ready**, one change or several:
   - Ask Claude to prepare the release: bump `APP_VERSION` in
     `public/index.html` (4.1.0, 4.2.0 for features, 4.1.1 for fixes) and add
     `tests/fixtures/exports/v<major>.<minor>.json` for a new minor version,
     a copy of the newest export shape. Merge that.
   - In Actions, open Release, click Run workflow and enter the version. It
     checks the version and tests, then Claude writes the release notes,
     creates the release and its tag, and comments on every issue it fixes
     with how to update.
7. **Deploy your own page**: in a Claude session on your machine, "deploy
   Seed Change from main, following the deploy checklist in AGENTS.md".

## Users' data

- Data lives in each user's own page database, which an update leaves alone:
  updating republishes the code to the same link (`docs/UPDATING.md`, the
  `update-seed-change` skill), after a full backup, and counts everything
  again afterwards.
- Changes add fields and collections; they don't reshape existing ones. When
  one has to, the release notes say so and the update skill migrates first.
- `tests/backups.test.js` imports an invented export from every version. A
  change that breaks an old backup fails the Tests check and can't merge.
  Never edit an old fixture; add a new one.

## Safety

- Issues are written by the public. Triage treats them as untrusted text and
  has read-only tools, plus commenting and labelling.
- Nothing is built until the owner adds `approved`, and the build follows the
  approved plan, not the reporter's wording. Its pull request still needs the
  Tests check and the owner's merge.
- The Tests check, the ruleset and the pre-commit hook still apply to every
  change, and the privacy rules in AGENTS.md apply to Claude's commits too.
- Costs and spam: triage is capped at 30 turns and 10 minutes per issue. If
  the repo gets spammed, disable the Triage workflow in Actions until it
  passes.
