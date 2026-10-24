// Backup packer tests. Run with: node --test tests/
// Each test builds a listing in a temporary folder, the way Claude saves the
// `jobs` and `profile` collections, and runs the script on it.
"use strict";
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SCRIPT = path.join(__dirname, "..", "scripts", "pack-backup.js");

const made = [];
after(() => made.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

function listing(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pack-backup-"));
  made.push(dir);
  for (const [name, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), typeof body === "string" ? body : JSON.stringify(body));
  }
  return dir;
}
function pack(dir, ...args) {
  const r = spawnSync(process.execPath, [SCRIPT, path.join(dir, "jobs"), path.join(dir, "backups"), ...args],
    { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}
const backup = (dir, date) =>
  JSON.parse(fs.readFileSync(path.join(dir, "backups", `application-desk-backup-${date}.json`), "utf8"));

const JOBS = {
  "jobs/acme-x1.json": { company: "Acme Example", title: "Analyst", status: "queued" },
  "jobs/globex-y2.json": { id: "globex-y2", company: "Globex Example", title: "Engineer", status: "applied" },
};
const PROFILE = { name: "Pat Example", headline: "Fictional analyst", skills: "Spreadsheets", experience: "", resume: "Pat Example\nFictional analyst" };

test("Backup: packs the jobs and the profile into one export", () => {
  const dir = listing({ ...JOBS, "profile/me.json": PROFILE });
  const r = pack(dir, "--profile", path.join(dir, "profile"), "--date", "2026-10-24");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Backed up 2 jobs, the profile and 0 resume versions to application-desk-backup-2026-10-24\.json/);
  const b = backup(dir, "2026-10-24");
  assert.equal(b.version, 3);
  assert.equal(b.exported, "2026-10-24");
  assert.deepEqual(b.profile, PROFILE);
  assert.deepEqual(b.jobs.map((j) => j.id), ["acme-x1", "globex-y2"]);   // the id comes from the file name
});

test("Backup: no profile yet writes null, and losing one since the last backup warns", () => {
  const dir = listing({ ...JOBS, "profile/me.json": PROFILE });
  assert.equal(pack(dir, "--profile", path.join(dir, "profile"), "--date", "2026-10-23").code, 0);
  fs.rmSync(path.join(dir, "profile"), { recursive: true });       // the next listing has no profile
  const r = pack(dir, "--profile", path.join(dir, "profile"), "--date", "2026-10-24");
  assert.equal(r.code, 0, r.out);
  assert.equal(backup(dir, "2026-10-24").profile, null);
  assert.match(r.out, /2 jobs, no profile and/);
  assert.match(r.out, /WARNING: application-desk-backup-2026-10-23\.json has a profile and this backup doesn't\./);
  // without --profile at all, the warning says so (the same day again, so 10-23 is still the previous one)
  assert.match(pack(dir, "--date", "2026-10-24").out, /doesn't \(no --profile given\)/);
});

test("Backup: a broken profile file writes nothing", () => {
  const dir = listing({ ...JOBS, "profile/me.json": "{ not json" });
  const r = pack(dir, "--profile", path.join(dir, "profile"), "--date", "2026-10-24");
  assert.equal(r.code, 1);
  assert.match(r.out, /me\.json is not valid JSON/);
  assert.equal(fs.existsSync(path.join(dir, "backups")), false);
  const arr = listing({ ...JOBS, "profile/me.json": "[]" });
  assert.match(pack(arr, "--profile", path.join(arr, "profile")).out, /is not a profile object/);
});

test("Backup: an empty job listing still writes nothing", () => {
  const dir = listing({ "jobs/notes.txt": "", "profile/me.json": PROFILE });
  const r = pack(dir, "--profile", path.join(dir, "profile"));
  assert.equal(r.code, 1);
  assert.match(r.out, /no jobs in .*nothing written, nothing deleted/);
  assert.equal(fs.existsSync(path.join(dir, "backups")), false);
});

test("Backup: resume versions go in oldest first, and losing some warns", () => {
  const v = (id, created) => ({ created, label: "Polish " + id, job: "", base: "profile", by: "claude", text: "Pat Example", notes: "" });
  const dir = listing({ ...JOBS, "resumes/r-bbbbbbb.json": v("b", "2026-10-22T10:00:00.000Z"),
    "resumes/r-aaaaaaa.json": v("a", "2026-10-23T10:00:00.000Z") });
  const r = pack(dir, "--resumes", path.join(dir, "resumes"), "--date", "2026-10-23");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /2 jobs, no profile and 2 resume versions/);
  assert.deepEqual(backup(dir, "2026-10-23").resumes.map((x) => x.id), ["r-bbbbbbb", "r-aaaaaaa"]);
  fs.rmSync(path.join(dir, "resumes"), { recursive: true });       // the next listing has none
  const again = pack(dir, "--resumes", path.join(dir, "resumes"), "--date", "2026-10-24");
  assert.equal(again.code, 0, again.out);
  assert.deepEqual(backup(dir, "2026-10-24").resumes, []);
  assert.match(again.out, /WARNING: resume versions fell from 2 to 0; versions are never deleted\./);
  const broken = listing({ ...JOBS, "resumes/r-x.json": "[]" });
  assert.match(pack(broken, "--resumes", path.join(broken, "resumes")).out, /r-x\.json is not a resume version object/);
});
