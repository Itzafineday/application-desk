# Set up your own Application Desk

This guide is for anyone, including people who have never used GitHub or
written code. Claude does the technical part. You copy one message, approve a
few prompts, and you get your own private job tracker.

About 15 minutes.

## What you need

- **A computer** running Windows or macOS.
- **A paid Claude plan** (Pro or Max). The Desk keeps your jobs in a small
  database attached to a Claude page, and free plans don't include that.
- **The Claude desktop app.** Step 1 covers installing it.

You don't need a GitHub account or any programming tools.

## Your privacy

Your Desk lives in **your own** Claude account. Nobody else can see your jobs,
notes or cover letters, including the person who wrote this tool, unless you
share the page's link with them yourself.

## Step 1: Install the Claude app

1. Go to **claude.ai/download** and download the app for your computer.
2. Open it and sign in with the account that has your paid plan.
3. At the top of the window, click the **Code** tab. Claude can work with files
   on your computer from this tab.

## Step 2: Pick a folder for Claude to work in

1. In the Code tab, Claude asks which folder to work in. Choose a folder you
   don't mind it adding files to, such as a new **Application Desk** folder
   inside **Documents**.
2. If Windows or macOS asks whether to trust the folder, say yes.

## Step 3: Ask Claude to set it up

Copy this message, paste it into the Code tab, and press Enter:

> Please set up the Application Desk for me. Download the project from
> https://github.com/Itzafineday/application-desk into this folder, then
> publish `public/index.html` as a private artifact with the `db` and
> `downloads` capabilities, following the project's README. Give me the link
> when it's done, and explain anything you need me to approve in plain
> language.

Claude works through it step by step. When it asks for permission to run a
command or publish the page, read its short description and click **Allow**.
At the end it gives you a link that starts with **claude.ai/artifact/**. That
link is your Desk.

**Bookmark the link.** You can also ask Claude to "pin the Desk to my
sidebar".

## Step 4: Check it worked

Open the link. Near the top left, next to "Application Desk", you should see a
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
3. In your Desk, click **Add postings** and paste with **Ctrl+V** (Mac: **Cmd+V**).
4. Check what it found (company, role, location, pay), then click
   **Add to queue**.

You can also paste just the job's link. Claude can fill in the details later.
If the job is already on your Desk, it tells you rather than adding it twice.

**Or let Claude collect them.** If you have the Claude browser extension
(Claude in Chrome), click **Save** on jobs you like on LinkedIn or Indeed,
then tell Claude in the Code tab: "Pull my saved Indeed jobs into my
Application Desk." Claude opens your saved list in your browser, reads each
posting, and adds the ones that aren't on your Desk yet. It only reads the
job sites; it doesn't apply or change anything there. Use a browser profile
where you're signed in to your own job-site account.

## Using it day to day

The Desk is built to work with Claude. In the Code tab, you can say things
like:

- "Look at the queued jobs in my Application Desk and score how well each one
  fits me." (Tell Claude about your experience first, or point it at your
  resume.)
- "Draft a cover letter for the [company] job in my Application Desk."
- "Answer the open questions in my Application Desk."

Changes Claude makes appear in the open page within a second or two, without
reloading.

In the page itself:

- **Status:** open a job and set it to Queued, Working, Applied, Interview,
  Offer or Closed. **Mark applied today** records today's date.
- **Letter tab:** edit the cover letter, then **Save PDF**. The PDF is kept to
  one page.
- **Questions tab:** type a question about the job, then ask Claude in chat to
  answer it. The answer appears in the thread.

## Keep a backup

Once a week, click **Export backup** at the top of the Desk and save the file
somewhere safe. If anything goes wrong, **Import** puts everything back.

## Getting help

If something doesn't work, describe it to Claude in the Code tab, for example:
"My Application Desk says 'This browser only'. Can you work out why?" Claude
can read the project's instructions and check your page.
