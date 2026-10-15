// Paste parser tests. Run with: node --test tests/
// Fixtures are fictional postings laid out exactly like real pastes.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

// Pin "now" so "1 week ago" always resolves to the same date.
Date.now = () => new Date(2026, 9, 15, 12, 0, 0).getTime();
const { parsePaste, linkedinId } = require("./load-parser")();

const fixture = (name) => fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");

test("LinkedIn: full page paste with logo line and match panel", () => {
  const p = parsePaste(fixture("linkedin-full.txt"));
  assert.equal(p.company, "Northgate Robotics");
  assert.equal(p.title, "Senior Cloud Engineer");
  assert.equal(p.location, "Vancouver, BC");
  assert.equal(p.posted, "2026-10-08");
  assert.equal(p.band, "$120,000 - $145,000");
  assert.equal(p.source, "LinkedIn");
  assert.equal(p.url, "https://www.linkedin.com/jobs/view/4000000001/");
});

test("LinkedIn: hybrid role with the CAD/yr salary chip", () => {
  const p = parsePaste(fixture("linkedin-hybrid-chip.txt"));
  assert.equal(p.company, "Harbourline Credit Union");
  assert.equal(p.title, "Sr Manager - IT Operations");
  assert.equal(p.location, "Burnaby, BC");
  assert.equal(p.posted, "2026-10-13");
  assert.equal(p.band, "$91,000 - $113,000");
});

test("LinkedIn: a bare link gives the URL and source only", () => {
  const p = parsePaste("https://www.linkedin.com/jobs/view/4000000003/?refId=abc123");
  assert.equal(p.url, "https://www.linkedin.com/jobs/view/4000000003/?refId=abc123");
  assert.equal(p.source, "LinkedIn");
  assert.equal(p.company, "");
});

test("linkedinId finds the job id in both URL styles", () => {
  assert.equal(linkedinId("https://www.linkedin.com/jobs/view/4000000004/"), "4000000004");
  assert.equal(linkedinId("https://www.linkedin.com/jobs/view/sr-engineer-at-acme-4000000005"), "4000000005");
  assert.equal(linkedinId("https://www.linkedin.com/jobs/search/?currentJobId=4000000006&keywords=it"), "4000000006");
  assert.equal(linkedinId("https://ca.indeed.com/viewjob?jk=abc123"), "");
});
