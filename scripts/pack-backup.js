#!/usr/bin/env node
// Packs a listing of the `jobs` collection (one JSON file per job, as Claude
// saves it with an ArtifactData "list" and an out_dir) into one dated Desk
// export, then keeps only the newest daily backups.
//
//   node scripts/pack-backup.js <jobs-dir> <backup-dir> [--keep 30] [--date YYYY-MM-DD]
//
// Writes <backup-dir>/application-desk-backup-<date>.json in the export shape
// from docs/schema.md, so the page's Import can read it. Only files named
// exactly like that are rotated: other files in the folder, such as a
// "-predeploy" copy, are never deleted. If the listing holds no jobs or a file
// won't parse, it writes nothing and deletes nothing.
"use strict";
const fs = require("fs");
const path = require("path");

const DAILY = /^application-desk-backup-(\d{4}-\d{2}-\d{2})\.json$/;

function fail(msg) {
  console.error("ERROR: " + msg);
  process.exit(1);
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function parseArgs(argv) {
  const args = { keep: 30, date: today(), positional: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--keep") args.keep = parseInt(argv[++i], 10);
    else if (argv[i] === "--date") args.date = argv[++i];
    else args.positional.push(argv[i]);
  }
  if (args.positional.length !== 2) {
    fail("usage: pack-backup.js <jobs-dir> <backup-dir> [--keep 30] [--date YYYY-MM-DD]");
  }
  if (!(args.keep >= 1)) fail("--keep must be a positive number");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) fail("--date must be YYYY-MM-DD");
  return args;
}

function readJobs(dir) {
  if (!fs.existsSync(dir)) fail(`no such folder: ${dir}`);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  return files.map((f) => {
    let job;
    try {
      job = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    } catch (e) {
      fail(`${f} is not valid JSON (${e.message})`);
    }
    if (!job || typeof job !== "object" || Array.isArray(job)) fail(`${f} is not a job object`);
    // The document id is the file name; older documents don't repeat it inside.
    job.id = job.id || f.replace(/\.json$/, "");
    return job;
  });
}

function dailyBackups(dir) {
  return fs.readdirSync(dir)
    .map((f) => ({ file: f, m: f.match(DAILY) }))
    .filter((x) => x.m)
    .map((x) => ({ file: x.file, date: x.m[1] }))
    .sort((a, b) => b.date.localeCompare(a.date));      // newest first
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const [jobsDir, backupDir] = args.positional;

  const jobs = readJobs(jobsDir);
  if (!jobs.length) fail(`no jobs in ${jobsDir}; nothing written, nothing deleted`);

  fs.mkdirSync(backupDir, { recursive: true });
  const previous = dailyBackups(backupDir).find((b) => b.date < args.date);
  let previousCount = null;
  if (previous) {
    try {
      previousCount = JSON.parse(fs.readFileSync(path.join(backupDir, previous.file), "utf8")).jobs.length;
    } catch (e) { /* an unreadable old backup doesn't block a new one */ }
  }

  // Write to a temporary name first so a sync client never picks up half a file.
  const name = `application-desk-backup-${args.date}.json`;
  const target = path.join(backupDir, name);
  const temp = target + ".tmp";
  const body = { version: 3, exported: args.date, profile: { name: "", contact: "" }, jobs };
  fs.writeFileSync(temp, JSON.stringify(body, null, 2) + "\n");
  fs.renameSync(temp, target);

  const removed = dailyBackups(backupDir).slice(args.keep);
  removed.forEach((b) => fs.unlinkSync(path.join(backupDir, b.file)));

  const kept = dailyBackups(backupDir).length;
  const since = previous ? ` (previous: ${previousCount ?? "?"} on ${previous.date})` : "";
  console.log(`Backed up ${jobs.length} jobs to ${name}${since}. ` +
    `Keeping ${kept} daily backups; removed ${removed.length}.`);
  if (previousCount && jobs.length < previousCount * 0.8) {
    console.log(`WARNING: the job count fell from ${previousCount} to ${jobs.length}. ` +
      `Check the Desk before older backups rotate out.`);
  }
}

main();
