// Tests for scripts/saved-jobs.js, the helper behind the sync-saved-jobs skill.
// Fixtures are fictional job pages laid out like Claude in Chrome's page text.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

Date.now = () => new Date(2026, 9, 15, 12, 0, 0).getTime();
const { canonical, check, build } = require("../scripts/saved-jobs");

const fixture = (name) => fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
const desk = [
  { id: "northgate-robotics-k3j9x2q", status: "applied", company: "Northgate Robotics",
    title: "Senior Cloud Engineer", url: "https://www.linkedin.com/jobs/view/senior-cloud-engineer-at-northgate-robotics-4000000001" },
  { id: "harbourline-ops", status: "closed", company: "Harbourline Credit Union",
    title: "Sr Manager - IT Operations", url: "" },
];

test("canonical: the link the Desk stores for each site", () => {
  assert.equal(canonical("https://www.linkedin.com/jobs/view/4000000010/?refId=abc&trk=x"),
    "https://www.linkedin.com/jobs/view/4000000010/");
  assert.equal(canonical("https://www.linkedin.com/jobs/view/senior-sysadmin-at-larchmont-4000000010"),
    "https://www.linkedin.com/jobs/view/4000000010/");
  assert.equal(canonical("https://ca.indeed.com/viewjob?jk=ABCDEF0123456789&from=saved"),
    "https://ca.indeed.com/viewjob?jk=abcdef0123456789");
  assert.equal(canonical("https://jobs.example.com/1"), "https://jobs.example.com/1");
});

test("check: new jobs, jobs already on the Desk, and repeats within the list", () => {
  const rows = check(desk, [
    { url: "https://www.linkedin.com/jobs/view/4000000010/", company: "Larchmont Analytics", title: "Senior Systems Administrator" },
    { url: "https://www.linkedin.com/jobs/view/4000000001/?refId=x", company: "Northgate Robotics", title: "Senior Cloud Engineer" },
    { url: "https://ca.indeed.com/viewjob?jk=abcdef0123456789", company: "Harbourline Credit Union", title: "Sr. Manager, IT Operations" },
    { url: "https://ca.indeed.com/viewjob?jk=0011223344556677", company: "Larchmont Analytics", title: "Senior Systems Administrator" },
  ]);
  assert.deepEqual(rows.map((r) => r.dup ? (r.dup.job.id || "run") + ": " + r.dup.why : "new"), [
    "new",
    "northgate-robotics-k3j9x2q: same LinkedIn job",
    "harbourline-ops: same company and title",
    "run: same company and title",
  ]);
});

test("build: new jobs get the schema's fields; duplicates and bad files are left out", () => {
  const now = new Date(Date.UTC(2026, 9, 15, 19, 0, 0));
  const rows = build(desk, [
    { name: "linkedin-4000000010.txt", text: fixture("linkedin-page-text.txt") },
    { name: "indeed-abcdef0123456789.txt", text: fixture("indeed-viewjob-page-text.txt") },
    { name: "linkedin-4000000001.txt", text: "https://www.linkedin.com/jobs/view/4000000001/\n" + fixture("linkedin-full.txt") },
    { name: "linkedin-4000000011.txt", text: fixture("linkedin-page-text.txt").replace("4000000010", "4000000011") },
    { name: "notes.txt", text: "Larchmont Analytics\nSenior Systems Administrator\n" },
  ], now);

  const li = rows[0].job;
  assert.match(li.id, /^larchmont-analytics-[0-9a-z]{7}$/);
  assert.deepEqual({ ...li, id: undefined, posting: undefined }, {
    id: undefined, posting: undefined,
    company: "Larchmont Analytics", title: "Senior Systems Administrator", created: "2026-10-15T19:00:00.000Z",
    band: "", location: "Vancouver, BC", url: "https://www.linkedin.com/jobs/view/4000000010/", source: "LinkedIn",
    posted: "2026-10-08", applied: null, status: "queued", fit: null, notes: "", letter: "", questions: [], qSeen: null,
  });
  assert.match(li.posting, /legally entitled to work in Canada\.$/);
  assert.deepEqual(rows[0].warnings, []);

  const ind = rows[1].job;
  assert.equal(ind.company, "Alder Peak Networks");
  assert.equal(ind.title, "Senior Network Administrator");
  assert.equal(ind.location, "North Vancouver, BC");
  assert.equal(ind.band, "$45 - $52 an hour (~$94k-$108k/yr)");
  assert.equal(ind.source, "Indeed");
  assert.equal(ind.url, "https://ca.indeed.com/viewjob?jk=abcdef0123456789");
  assert.equal(ind.posted, "2026-10-15");             // Indeed's own page shows no date: the day it was added
  assert.match(ind.posting, /^https:\/\/ca\.indeed\.com\/viewjob\?jk=abcdef0123456789\nSenior Network Administrator\nAlder Peak Networks\n/);
  assert.match(ind.posting, /Work Location: In person$/);
  assert.doesNotMatch(ind.posting, /Skip to main content|Company reviews|Hiring Lab|Apply on company site/);

  assert.equal(rows[2].dup.job.id, "northgate-robotics-k3j9x2q");
  assert.equal(rows[2].dup.why, "same LinkedIn job");
  assert.equal(rows[3].dup.job, li);                  // the same posting under another id, earlier in the run
  assert.equal(rows[3].dup.why, "same company and title");
  assert.equal(rows[4].job, undefined);
  assert.match(rows[4].warnings[0], /first line is not the job's URL/);
});

test("build: \"1 week ago\" counts back from when the page was saved", () => {
  const saved = new Date(2026, 9, 10, 12, 0, 0).getTime();
  const [row] = build(desk, [{ name: "linkedin-4000000010.txt", text: fixture("linkedin-page-text.txt"), saved }]);
  assert.equal(row.job.posted, "2026-10-03");
  assert.equal(new Date(Date.now()).getDate(), 15);   // the clock is put back
});
