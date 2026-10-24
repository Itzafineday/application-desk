#!/usr/bin/env node
// Turns jobs marked Saved on LinkedIn or Indeed into new Seed Change
// jobs, leaving out any it already has. Claude runs it during the sync-saved-jobs
// skill (.claude/skills/sync-saved-jobs/SKILL.md). It never touches the database.
//
//   node scripts/saved-jobs.js check <jobs-dir> <saved.json>
//   node scripts/saved-jobs.js build <jobs-dir> <pages-dir> <out-dir>
//
// <jobs-dir> is a listing of the `jobs` collection: one JSON file per job, as
// an ArtifactData "list" with an out_dir saves it.
//
// check reads <saved.json>, a list of { url, company, title } read off the
// sites' saved-jobs pages, and prints which are new and which Seed
// Change already has, and why. It writes nothing.
//
// build reads one text file per job page from <pages-dir>: the job's URL on
// the first line, then the page text. Each is parsed with the page's own
// parser and checked with its duplicate rule (against the existing jobs and against
// jobs earlier in the run). Dates like "1 week ago" count back from when each
// page file was last written. Each new job is written to <out-dir>/<id>.json in
// the shape of docs/schema.md, ready to create with an ArtifactData batch.
// <out-dir> must be new or empty, so no stale file gets created by mistake.
"use strict";
const fs = require("fs");
const path = require("path");
const { parsePaste, jobRef, findDuplicate } = require("../tests/load-parser")();

function fail(msg) {
  console.error("ERROR: " + msg);
  process.exit(1);
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function readJobs(dir) {
  if (!fs.existsSync(dir)) fail(`no such folder: ${dir}`);
  const jobs = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => {
    let job;
    try {
      job = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    } catch (e) {
      fail(`${f} is not valid JSON (${e.message})`);
    }
    // The document id is the file name; older documents don't repeat it inside.
    job.id = job.id || f.replace(/\.json$/, "");
    return job;
  });
  // An empty listing means the read failed: every job would look new.
  if (!jobs.length) fail(`no jobs in ${dir}; list the jobs collection first`);
  return jobs;
}

/* The link Seed Change stores: a LinkedIn job's own page, or Indeed's viewjob page. */
function canonical(url) {
  url = String(url || "").trim();
  const ref = jobRef(url);
  if (!ref) return url;
  if (ref.site === "LinkedIn") return `https://www.linkedin.com/jobs/view/${ref.id}/`;
  const host = (url.match(/^https?:\/\/([^\/?#]+)/i) || [])[1] || "ca.indeed.com";
  return `https://${host}/viewjob?jk=${ref.id}`;
}

/* Same id format as the page's uid(): company slug plus 7 random characters. */
function uid(company, taken) {
  let id;
  do {
    id = String(company || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 26) +
      "-" + Math.random().toString(36).slice(2, 9);
  } while (taken.has(id) || !/-[0-9a-z]{7}$/.test(id));
  taken.add(id);
  return id;
}

function reason(dup) {
  return dup.job.id
    ? `${dup.why} as ${dup.job.id} (${dup.job.status || "queued"})`
    : `${dup.why} as ${dup.job.url || dup.job.company + " / " + dup.job.title}, earlier in this run`;
}

/* saved: [{url, company, title}] -> [{p, dup}] with dup null for a new job. */
function check(desk, saved) {
  const seen = [];
  return saved.map((s) => {
    const p = { url: canonical(s.url), company: s.company || "", title: s.title || "" };
    const dup = findDuplicate(desk, p) || findDuplicate(seen, p);
    if (!dup) seen.push(p);
    return { p, dup };
  });
}

/* pages: [{name, text, saved}] -> [{name, job | dup, warnings}]. `saved` is
   when the page was read (ms); "1 week ago" counts back from then, not now. */
function build(desk, pages, now) {
  const taken = new Set(desk.map((j) => j.id));
  const added = [];
  const date = now ? now.toISOString().slice(0, 10) : today();
  return pages.map(({ name, text, saved }) => {
    text = String(text).replace(/^﻿/, "").replace(/\r/g, "");
    const first = text.split("\n")[0].trim();
    if (!/^https?:\/\/\S+$/.test(first)) return { name, warnings: ["first line is not the job's URL; skipped"] };
    const clock = Date.now;
    if (saved) Date.now = () => saved;
    let p;
    try {
      p = parsePaste(text);
    } finally {
      Date.now = clock;
    }
    p.url = canonical(first);
    const ref = jobRef(p.url);
    const dup = findDuplicate(desk, p) || findDuplicate(added, p);
    if (dup) return { name, p, dup };

    const warnings = [];
    if (!p.company) warnings.push("no company found");
    if (!p.title) warnings.push("no title found");
    if (!p.location) warnings.push("no location found");
    if (!p.posting) warnings.push("page layout not recognised: the posting is the whole text");
    const job = {
      id: uid(p.company, taken),
      company: p.company || "Unknown company",
      title: p.title || "Untitled role",
      created: (now || new Date()).toISOString(),
      band: p.band, location: p.location, url: p.url,
      source: p.source || (ref ? ref.site : ""),
      posted: p.posted || date, applied: null, status: "queued",
      fit: null, notes: "", posting: p.posting || text.trim(), letter: "", questions: [], qSeen: null,
    };
    added.push(job);
    return { name, job, warnings };
  });
}

function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === "check" && args.length === 2) {
    const desk = readJobs(args[0]);
    let saved;
    try {
      saved = JSON.parse(fs.readFileSync(args[1], "utf8"));
    } catch (e) {
      fail(`can't read ${args[1]} (${e.message})`);
    }
    if (!Array.isArray(saved)) fail(`${args[1]} must hold a list of { url, company, title }`);
    const rows = check(desk, saved);
    rows.forEach(({ p, dup }) => console.log(dup
      ? `SKIP  ${p.url}  ${p.company} / ${p.title}: ${reason(dup)}`
      : `NEW   ${p.url}  ${p.company} / ${p.title}`));
    const fresh = rows.filter((r) => !r.dup).length;
    console.log(`${fresh} new, ${rows.length - fresh} skipped, of ${rows.length} saved (Seed Change has ${desk.length}).`);
  } else if (cmd === "build" && args.length === 3) {
    const [jobsDir, pagesDir, outDir] = args;
    const desk = readJobs(jobsDir);
    if (!fs.existsSync(pagesDir)) fail(`no such folder: ${pagesDir}`);
    const pages = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".txt")).sort().map((name) => {
      const file = path.join(pagesDir, name);
      return { name, text: fs.readFileSync(file, "utf8"), saved: fs.statSync(file).mtimeMs };
    });
    if (!pages.length) fail(`no .txt pages in ${pagesDir}`);
    if (fs.existsSync(outDir) && fs.readdirSync(outDir).length) fail(`${outDir} is not empty; use a new folder`);
    fs.mkdirSync(outDir, { recursive: true });

    const rows = build(desk, pages);
    rows.forEach((r) => {
      if (r.job) {
        const j = r.job;
        fs.writeFileSync(path.join(outDir, j.id + ".json"), JSON.stringify(j, null, 2) + "\n");
        console.log(`ADD   ${r.name}  ${j.company} / ${j.title}  [${j.location || "?"}; ${j.band || "no band"}; posted ${j.posted}] -> ${j.id}.json`);
      } else if (r.dup) {
        console.log(`SKIP  ${r.name}  ${r.p.company} / ${r.p.title}: ${reason(r.dup)}`);
      }
      (r.warnings || []).forEach((w) => console.log(`CHECK ${r.job ? r.job.id + ".json" : r.name}: ${w}`));
    });
    const n = rows.filter((r) => r.job).length;
    console.log(`${n} to add, ${rows.filter((r) => r.dup).length} skipped, ` +
      `${rows.filter((r) => !r.job && !r.dup).length} unreadable, of ${rows.length} pages. Jobs written to ${outDir}.`);
  } else {
    fail("usage: saved-jobs.js check <jobs-dir> <saved.json>\n" +
      "       saved-jobs.js build <jobs-dir> <pages-dir> <out-dir>");
  }
}

if (require.main === module) main();
module.exports = { canonical, check, build };
