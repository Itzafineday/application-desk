// Every export from every version must keep importing. Each file in
// tests/fixtures/exports is an invented backup in the shape a release wrote;
// add one when a release changes that shape, and never edit the old ones.
// Run with: node --test tests/
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadSection } = require("./load-parser");

let n = 0;
const { readBackup, APP_VERSION } = loadSection(
  "/* ============================ state", "/* ============================ stores",
  ["readBackup", "APP_VERSION"],
  { window: {}, localStorage: { getItem: () => null, setItem() {} }, uid: (co) => "made-id-" + (++n) });

const dir = path.join(__dirname, "fixtures", "exports");
const load = (name) => readBackup(JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));

test("Backups: v3 exports, with the old empty profile and pre-v4 jobs", () => {
  const b = load("v3.json");
  assert.equal(b.jobs.length, 2);
  assert.equal(b.profile, null);                                   // {name, contact} is not a profile
  assert.equal(b.jobs[0].questions.length, 2);
  assert.equal(b.jobs[0].qSeen, "q-bbbbbbb");
  assert.deepEqual(b.jobs[0].form, []);                            // fields added since read as empty
  assert.equal(b.jobs[1].id, "made-id-1");                         // an old job without an id gets one
  assert.equal(b.jobs[1].status, "queued");                        // an unknown status reads as queued
  assert.deepEqual([b.resumes, b.documents, b.guides], [[], [], []]);
});

test("Backups: v4.0 exports, with the profile and Help me apply questions", () => {
  const b = load("v4.0.json");
  assert.equal(b.profile.name, "Pat Example");
  assert.equal(b.profile.voice, "");                               // added in 4.1
  assert.equal(b.jobs[1].form[0].answer, "A fictional answer.");
  assert.deepEqual(b.resumes, []);
});

test("Backups: v4.1 exports, with resume versions, documents and guides", () => {
  const b = load("v4.1.json");
  assert.equal(b.profile.voice, "Short and plain.");
  assert.equal(b.resumes[0].id, "r-aaaaaaa");
  assert.equal(b.documents[0].kind, "reference");
  assert.match(b.documents[0].text, /alex@example\.org/);          // references keep their details
  assert.deepEqual(b.guides[0].status, { headline: "done" });
  assert.deepEqual(b.guides[0].answers, {});
});

test("Backups: the demo data is a valid backup, and a file that isn't one is refused", () => {
  const b = readBackup(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "public", "sample-data.json"), "utf8")));
  assert.equal(b.jobs.length, 10);
  assert.ok(b.profile && b.resumes.length && b.documents.length && b.guides.length);
  assert.throws(() => readBackup({ hello: "world" }), /not a backup/);
  assert.throws(() => readBackup(null), /not a backup/);
});

test("Backups: there is a fixture for the current version's shape", () => {
  const [major, minor] = APP_VERSION.split(".");
  assert.ok(fs.existsSync(path.join(dir, `v${major}.${minor}.json`)),
    `add tests/fixtures/exports/v${major}.${minor}.json for ${APP_VERSION}`);
});
