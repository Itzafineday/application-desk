# Set up your own Seed Change

This guide is for anyone, including people who have never used GitHub or
written code. Claude does the technical part. You copy one message, approve a
few prompts, and you get your own private job tracker.

About 15 minutes.

**Prefer one step at a time?** The same steps are in an
[interactive setup guide](https://claude.ai/artifact/PNT4nNwMgkUz3xradGa6j3):
one card per step, a check at the end of each, and a **Raise a hand** button
on every step if you get stuck. It remembers where you got to. This page has
everything too, if you'd rather read it all at once.

## What you need

- **A computer** running Windows or macOS.
- **A paid Claude plan** (Pro or Max). Seed Change keeps your jobs in a small
  database attached to a Claude page, and free plans don't include that.
  No account yet? [Sign up with this invite](https://claude.ai/referral/9HvNfl27wQ)
  for a free week of Claude. When the week ends, choose **Pro** (about US$20 a
  month; cancel any time in Settings, Billing). On the free plan already? Try
  the invite first; if it's only for new accounts, upgrade to Pro in
  claude.ai, Settings, Billing.
- **The Claude desktop app.** Step 1 covers installing it.

You don't need a GitHub account or any programming tools.

## Your privacy

Your copy of Seed Change lives in **your own** Claude account. Nobody else can
see your jobs, notes or cover letters, including the person who wrote this
tool. Its database is set so that only you can read it, so even if you share
the page's link, other people can't see your data or your
references' contact details.

## Step 1: Install the Claude app

1. Go to **claude.ai/download** and download the app for your computer.
2. Open it and sign in with the account that has your paid plan.
3. At the top of the window, click the **Code** tab. Claude can work with files
   on your computer from this tab.

## Step 2: Pick a folder for Claude to work in

1. In the Code tab, Claude asks which folder to work in. Choose a folder you
   don't mind it adding files to, such as a new **Seed Change** folder
   inside **Documents**.
2. If Windows or macOS asks whether to trust the folder, say yes.

## Step 3: Ask Claude to set it up

Copy this message, paste it into the Code tab, and press Enter:

> Please set up Seed Change for me. Download the project from
> https://github.com/Itzafineday/application-desk into this folder, then
> publish `public/index.html` as a private artifact with the `db`
> capability limited to me (only the owner can read or write it) and the
> `downloads` capability, following the project's README. Give me the link
> when it's done, and explain anything you need me to approve in plain
> language.

Claude works through it step by step. When it asks for permission to run a
command or publish the page, read its short description and click **Allow**.
At the end it gives you a link that starts with **claude.ai/artifact/**. That
link is your Seed Change page.

**Bookmark the link.** You can also ask Claude to "pin Seed Change to my
sidebar".

## Step 4: Check it worked

Open the link. Near the top left, next to "Seed Change", you should see a
green dot and **Synced with Claude**.

| What it says | What it means |
|---|---|
| Synced with Claude | All good. Your jobs are saved to your account. |
| This browser only | The page can't reach its database. Open it from the claude.ai link while signed in. If that doesn't fix it, ask Claude to check that the page was published with the `db` capability. |
| Demo data, not saved | You opened a copy of the file, not your published page. Use the claude.ai link instead. |

## Step 5: Add your first job

1. Open a job posting on **LinkedIn** or **Indeed**.
2. Press **Ctrl+A** then **Ctrl+C** (on a Mac, **Cmd+A** then **Cmd+C**) to copy
   the whole page.
3. In Seed Change, click **Add postings** and paste with **Ctrl+V** (Mac: **Cmd+V**).
4. Check what it found (company, role, location, pay), then click
   **Add to queue**.

You can also paste just the job's link. Claude can fill in the details later.
If the job is already saved, it tells you rather than adding it twice.

## Step 6 (optional): Let Claude collect your saved jobs

If you click **Save** on jobs you like on LinkedIn or Indeed, Claude can pick
them up for you. Neither site lets apps read your saved jobs directly, so
Claude reads them the way you would: in your own Chrome, through the Claude in
Chrome extension. It never sees your job-site passwords.

1. In **Google Chrome** (other browsers don't work), open the Chrome Web
   Store, search for **Claude**, and add the extension made by Anthropic.
2. Click its icon, sign in with the same Claude account as the app, and allow
   the permissions it asks for. Pin it to the toolbar so it's easy to find.
3. In that same Chrome, sign in to **LinkedIn** and **Indeed** as usual.
4. In the Claude app, open the Code tab in your Seed Change folder and say:
   "Pull my saved LinkedIn and Indeed jobs into Seed Change." If Claude says
   it can't reach your browser, type `/chrome` and follow its prompt, or turn
   on **Claude in Chrome** under Settings, Connectors.

What happens next: Claude opens a new tab, reads your Saved lists, skips the
jobs Seed Change already has, and copies each new posting's text. It backs up
your jobs, shows you what it will add, and adds them as **Queued** only when
you say go. It only reads the job sites: it never applies, saves, unsaves or
messages anyone there. If a site asks you to sign in or to prove you're human,
Claude stops and asks you to do it.

## Using it day to day

Seed Change is built to work with Claude. In the Code tab, you can say things
like:

- "Look at the queued jobs in Seed Change and score how well each one
  fits me." (Tell Claude about your experience first, or point it at your
  resume.)
- "Draft a cover letter for the [company] job in Seed Change."
- "Answer the open questions in Seed Change."

Changes Claude makes appear in the open page within a second or two, without
reloading.

In the page itself:

- **Get started** (top of the page, optional): paste your resume or pick a
  PDF or Word file, check what was read, and save it as your profile. Claude
  then uses it when scoring jobs and writing letters. Once saved, the button
  says **Profile**, and you can change it there any time.
- **Status:** open a job and set it to Queued, Working, Applied, Interview,
  Offer or Closed. **Mark applied today** records today's date.
- **Letter tab:** edit the cover letter, then **Save PDF**. The PDF is kept to
  one page.
- **Questions tab:** type a question about the job, then ask Claude in chat to
  answer it. The answer appears in the thread.
- **Resume versions** (in **Profile**, or **Tailor resume** on a job's Letter
  tab): pick the job, or none for a general polish, click **Copy request for
  Claude** and paste it into your chat. Claude's version appears with notes
  on what it changed. Edit any version and save it as a new one, or click
  **Save PDF**.
- **Documents** (in **Profile**): add past cover letters, references and
  writing samples from a file or pasted text. **Copy request: learn how I
  write** has Claude write a note on your style that it follows from then
  on; **Copy request: references sheet** makes a sheet you can save as a PDF.
- **Guides** (in **Profile**): pick LinkedIn, Indeed or the practice
  interview. Each step says where to click and shows Claude's draft to copy;
  click **Done** or **Skip** to move on. For drafts, click **Copy request for
  Claude** and paste it into your chat. If you have Claude in Chrome, Claude
  reads your current profile first, but never changes anything there.
- **Help me apply tab:** when a company's own site asks you to fill in a long
  form, copy its questions, paste them here, and click **Copy request for
  Claude**. Paste that into your chat with Claude, and a draft answer appears
  under each question. Check it, then copy it into the form yourself. Claude
  never submits anything.

## Keep a backup

Once a week, click **Export backup** at the top of the page and save the file
somewhere safe. If anything goes wrong, **Import** puts everything back.

## Updating

When there's a new release, ask Claude to update your page; your data stays
where it is. [UPDATING.md](UPDATING.md) has the message to send.

## Getting help

If something doesn't work, describe it to Claude in the Code tab, for example:
"Seed Change says 'This browser only'. Can you work out why?" Claude
can read the project's instructions and check your page.
