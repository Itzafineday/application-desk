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

1. **Claude's access to the API.** The workflows look for one of two things.
   Set up only one.
   - **An API key** (simplest). In console.anthropic.com, create a workspace
     just for this repo (Settings, Workspaces), give it a monthly spend limit
     (Limits), and create an API key in that workspace. In the repo, open
     Settings, then Secrets and variables, then Actions, and add a repository
     secret `ANTHROPIC_API_KEY`. Billed per use.
   - **Workload identity federation** (no key to leak). In the Console, go
     to Settings, Workload identity, Connect workload, GitHub Actions. Let
     the wizard register GitHub's issuer (discovery mode), create a service
     account, and create a rule that targets your workspace and matches only
     this repo's main branch: subject prefix
     `repo:<owner>/<repo>:ref:refs/heads/main`, audience
     `https://api.anthropic.com`, and claims `repository_owner: <owner>` and
     `ref: refs/heads/main`. The workflows run on issue events and Run
     workflow from main, which both carry that subject, while pull requests
     and other branches don't match. Then add four repository *variables*
     (same page, Variables tab): `ANTHROPIC_FEDERATION_RULE_ID` (`fdrl_...`),
     `ANTHROPIC_ORGANIZATION_ID` (Settings, Organization),
     `ANTHROPIC_SERVICE_ACCOUNT_ID` (`svac_...`) and
     `ANTHROPIC_WORKSPACE_ID` (`wrkspc_...`). Each run then gets a token that
     lasts minutes, so there is no secret stored anywhere. If a run fails
     with "Authentication failed", the Workload identity page's History tab
     says which check didn't match.

   To use a Claude subscription instead, run `claude setup-token` locally,
   save the token as `CLAUDE_CODE_OAUTH_TOKEN`, and in the three workflows
   replace `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}` with
   `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`. That
   token can do anything your subscription can, so the key or federation is
   the safer choice for a public repo.
2. **Actions settings.** In Settings, Actions, General, under Workflow
   permissions, keep "Read repository contents" as the default and tick
   "Allow GitHub Actions to create and approve pull requests" (the build
   workflow opens pull requests). Each workflow asks for the few
   permissions it needs.
3. **Notifications.** Watch the repo (All activity, or Custom with Issues and
   Pull requests) so triage comments reach you by email or on your phone.
4. **Ruleset on main** (done): pull request required, Tests must pass, no
   force pushes or deletion.
5. **The first build.** Pull requests opened by a workflow don't start other
   workflows, so the build starts the Tests check on its branch itself. Check
   that the first build's pull request shows "node --test" passing. If it
   says the check is expected but never ran, close and reopen the pull
   request, which runs it as you.

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
   owner adds `approved`. Claude edits the code and adds tests; the workflow
   checks the change, runs the tests, pushes `claude/issue-<n>`, and opens a
   pull request that says "Fixes #<n>" and links it on the issue. If a check
   or test fails, it comments on the issue instead. Nothing merges, releases,
   deploys or changes `.github/`.
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

Issues are written by the public, and anyone can write one that tries to talk
Claude into something (prompt injection). The workflows are built so that even
a Claude that was fooled can't do harm:

- **Claude never holds a token that can write.** In every workflow, the job
  that runs Claude has the Anthropic key, a read-only GitHub token, and no
  shell or web access (`.github/claude-settings.json` also blocks reading
  system files). It reads files the workflow saved for it and writes one
  result: a triage verdict, a patch, or release notes.
- **A separate job, without the key, checks that result before using it**
  (`.github/scripts/ci.js`, tested in `tests/ci.test.js`): only the allowed
  triage actions and labels, no secrets in anything posted, no change to
  `.github/`, `.githooks/` or git's files, and the tests must pass before
  anything is pushed. Claude's code runs only in a read-only job.
- Nothing is built until the owner adds `approved`, and the build follows the
  approved plan, not the reporter's wording. Its pull request still needs the
  Tests check and the owner's merge.
- The Tests check, the ruleset and the pre-commit hook still apply to every
  change, and the privacy rules in AGENTS.md apply to Claude's changes too.
- **If the key leaks** anyway, someone could only spend money on it, up to the
  workspace's limit; it can't reach this repo, your claude.ai account or your
  data. Delete the key in the Console (it stops working at once), make a new
  one and update the secret. With federation there is no key to leak.
- Costs and spam: triage is capped at 30 turns and 10 minutes per issue, and
  the workspace's spend limit caps the total. If the repo gets spammed,
  disable the Triage workflow in Actions until it passes.
