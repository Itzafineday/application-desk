# Updating Seed Change

New releases fix bugs and add features. Updating keeps **your page's link and
everything in it**: your jobs, profile, resumes, documents and guides live in
your page's own database, and an update only replaces the page's code. Claude
also makes a backup first, so nothing can be lost.

About 5 minutes.

## How to tell there's an update

- Click the version next to "Seed Change" at the top of your page, then
  **What's new**. It lists every release and what changed.
- If you reported a bug or asked for a feature on GitHub, you'll get a
  comment on your report when it's released.
- To hear about every release, open the project on GitHub, click **Watch**,
  then **Custom**, then tick **Releases**.

## Update

Open the Claude desktop app, go to the **Code** tab in the folder where you
set up Seed Change, and send:

> Please update my Seed Change to the latest release, following
> docs/UPDATING.md in the project. My page is: (paste your claude.ai/artifact/
> link here)

Claude will:

1. Get the latest release of the project.
2. Back up everything in your page to a dated file in a **Seed Change
   backups** folder next to the project. Keep that folder private: it holds
   your letters and your references' contact details.
3. Publish the new version to **the same link**, without changing who can
   see it.
4. Count your jobs, resume versions, documents and guides again and check
   they all match the backup, then ask you to open the page.

Approve each step when Claude asks. When it's done, open your page and check:

- It says **Synced with Claude** at the top.
- Clicking the version shows the new number.
- Your jobs are all there.

## If something looks wrong

Tell Claude what you see. Nothing is lost: the backup from step 2 has
everything. To restore it yourself, click **Import** at the top of your page
and choose the backup file; it puts back anything missing without making
duplicates.

## For Claude

The steps are in the `update-seed-change` skill
(`.claude/skills/update-seed-change/SKILL.md`).
