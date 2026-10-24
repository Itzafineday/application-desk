#!/usr/bin/env node
// Packs a listing of the `jobs` collection (one JSON file per job, as Claude
// saves it with an ArtifactData "list" and an out_dir), and optionally of the
// `profile` and `resumes` collections, into one dated Seed Change export, then
// keeps only the newest daily backups.
//
//   node scripts/pack-backup.js <jobs-dir> <backup-dir> [--profile <profile-dir>]
//                               [--resumes <resumes-dir>] [--keep 30] [--date YYYY-MM-DD]
//
// Writes <backup-dir>/application-desk-backup-<date>.json in the export shape
// from docs/schema.md, so the page's Import can read it. Only files named
// exactly like that are rotated: other files in the folder, such as a
// "-predeploy" copy, are never deleted. If the listing holds no jobs or a file
// won't parse, it writes nothing and deletes nothing. The profile is the one
// document me.json in <profile-dir>; when there is none yet, the export's
// profile is null. Resume versions are every JSON file in <resumes-dir>; a
// missing folder means none yet.
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
  const args = { keep: 30, date: today(), profile: null, resumes: null, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--keep") args.keep = parseInt(argv[++i], 10);
    else if (argv[i] === "--date") args.date = argv[++i];
    else if (argv[i] === "--profile") args.profile = argv[++i];
    else if (argv[i] === "--resumes") args.resumes = argv[++i];
    else args.positional.push(argv[i]);
  }
  if (args.positional.length !== 2 || args.profile === undefined || args.resumes === undefined) {
    fail("usage: pack-backup.js <jobs-dir> <backup-dir> [--profile <profile-dir>] " +
      "[--resumes <resumes-dir>] [--keep 30] [--date YYYY-MM-DD]");
  }
  if (!(args.keep >= 1)) fail("--keep must be a positive number");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) fail("--date must be YYYY-MM-DD");
  return args;
}

// One document per JSON file, its id from the file name when it lacks one.
function readJobs(dir, kind = "job") {
  if (!fs.existsSync(dir)) fail(`no such folder: ${dir}`);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  return files.map((f) => {
    let job;
    try {
      job = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    } catch (e) {
      fail(`${f} is not valid JSON (${e.message})`);
    }
    if (!job || typeof job !== "object" || Array.isArray(job)) fail(`${f} is not a ${kind} object`);
    // The document id is the file name; older documents don't repeat it inside.
    job.id = job.id || f.replace(/\.json$/, "");
    return job;
  });
}

// The profile document, or null when the listing has none (no profile yet).
function readProfile(dir) {
  const file = path.join(dir, "me.json");
  if (!fs.existsSync(file)) return null;
  let profile;
  try {
    profile = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    fail(`${file} is not valid JSON (${e.message})`);
  }
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) fail(`${file} is not a profile object`);
  return profile;
}

// Exports from before v4 carry an empty {name, contact}; only text beyond a
// name counts as a profile, as in the page's Import.
function hasProfile(p) {
  return !!p && ["headline", "skills", "experience", "resume"]
    .some((f) => typeof p[f] === "string" && p[f].trim());
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
  const profile = args.profile ? readProfile(args.profile) : null;
  // Versions never change once saved, so they go in the order they were made.
  const resumes = args.resumes && fs.existsSync(args.resumes)
    ? readJobs(args.resumes, "resume version").sort((a, b) => String(a.created).localeCompare(String(b.created)))
    : [];

  fs.mkdirSync(backupDir, { recursive: true });
  const previous = dailyBackups(backupDir).find((b) => b.date < args.date);
  let previousCount = null, previousProfile = false, previousResumes = 0;
  if (previous) {
    try {
      const old = JSON.parse(fs.readFileSync(path.join(backupDir, previous.file), "utf8"));
      previousProfile = hasProfile(old.profile);
      previousResumes = Array.isArray(old.resumes) ? old.resumes.length : 0;
      previousCount = old.jobs.length;
    } catch (e) { /* an unreadable old backup doesn't block a new one */ }
  }

  // Write to a temporary name first so a sync client never picks up half a file.
  const name = `application-desk-backup-${args.date}.json`;
  const target = path.join(backupDir, name);
  const temp = target + ".tmp";
  const body = { version: 3, exported: args.date, profile, resumes, jobs };
  fs.writeFileSync(temp, JSON.stringify(body, null, 2) + "\n");
  fs.renameSync(temp, target);

  const removed = dailyBackups(backupDir).slice(args.keep);
  removed.forEach((b) => fs.unlinkSync(path.join(backupDir, b.file)));

  const kept = dailyBackups(backupDir).length;
  const since = previous ? ` (previous: ${previousCount ?? "?"} on ${previous.date})` : "";
  console.log(`Backed up ${jobs.length} jobs, ${profile ? "the profile" : "no profile"} and ` +
    `${resumes.length} resume version${resumes.length === 1 ? "" : "s"} ` +
    `to ${name}${since}. Keeping ${kept} daily backups; removed ${removed.length}.`);
  if (previousCount && jobs.length < previousCount * 0.8) {
    console.log(`WARNING: the job count fell from ${previousCount} to ${jobs.length}. ` +
      `Check Seed Change before older backups rotate out.`);
  }
  if (resumes.length < previousResumes) {
    console.log(`WARNING: resume versions fell from ${previousResumes} to ${resumes.length}` +
      `${args.resumes ? "" : " (no --resumes given)"}; versions are never deleted. ` +
      `Check Seed Change before older backups rotate out.`);
  }
  if (previousProfile && !hasProfile(profile)) {
    console.log(`WARNING: ${previous.file} has a profile and this backup doesn't` +
      `${args.profile ? "" : " (no --profile given)"}. ` +
      `Check Seed Change before older backups rotate out.`);
  }
}

main();
