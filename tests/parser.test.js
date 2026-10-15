// Paste parser tests. Run with: node --test tests/
// Fixtures are fictional postings laid out exactly like real pastes.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

// Pin "now" so "1 week ago" always resolves to the same date.
Date.now = () => new Date(2026, 9, 15, 12, 0, 0).getTime();
const { parsePaste, linkedinId, indeedKey, jobRef } = require("./load-parser")();

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

test("Indeed: search results with a logo line read only the selected job", () => {
  const p = parsePaste(fixture("indeed-search-with-logo.txt"));
  assert.equal(p.company, "Kestrel Water Systems");
  assert.equal(p.title, "Senior Infrastructure Specialist");
  assert.equal(p.location, "Richmond, BC");
  assert.equal(p.band, "$105,000 - $130,000");      // not the first card's band
  assert.equal(p.source, "Indeed");
  assert.equal(p.url, "https://ca.indeed.com/viewjob?jk=0123456789abcdef");
  assert.equal(p.posted, "");
  // The saved text is the job alone: no result list, greeting, footer or tracking code.
  assert.match(p.posting, /^https:\/\/ca\.indeed\.com\/viewjob\?jk=0123456789abcdef\nSenior Infrastructure Specialist\nKestrel Water Systems\n/);
  assert.match(p.posting, /Full job description/);
  assert.match(p.posting, /#LI-Onsite$/);
  assert.doesNotMatch(p.posting, /Welcome|Brightfield|Coastline|Hiring Lab|bX7kQ2mZ9p|logo|Apply now/);
});

test("Indeed: search results without a logo line, hourly pay, job alert box", () => {
  const p = parsePaste(fixture("indeed-search-no-logo.txt"));
  assert.equal(p.company, "Northwind Managed IT Ltd.");
  assert.equal(p.title, "Senior Systems Engineer (Tier 3)");
  assert.equal(p.location, "Vancouver, BC");
  assert.equal(p.band, "$30 - $38 an hour (~$62k-$79k/yr)");
  assert.equal(p.url, "https://ca.indeed.com/viewjob?jk=fedcba9876543210");
  assert.doesNotMatch(p.posting, /person@example\.com|Meridian|Career Resources|Sort by/);
  assert.match(p.posting, /Work Location: In person$/);
});

test("Indeed: the job pane pasted on its own, without a link", () => {
  const pane = fixture("indeed-search-no-logo.txt").split("Career Resources: - Explore High Paying Jobs\n")[1];
  const p = parsePaste(pane);
  assert.equal(p.company, "Northwind Managed IT Ltd.");
  assert.equal(p.title, "Senior Systems Engineer (Tier 3)");
  assert.equal(p.source, "Indeed");
  assert.equal(p.url, "");
});

test("Indeed: monthly and single-figure pay get a yearly estimate", () => {
  const base = fixture("indeed-search-no-logo.txt");
  const withPay = (pay) => base.split("$30–$38 an hour\n -  ").join(pay + "\n -  ");
  assert.equal(parsePaste(withPay("$7,200 a month")).band, "$7,200 a month (~$86k/yr)");
  assert.equal(parsePaste(withPay("$57.15 an hour")).band, "$57.15 an hour (~$119k/yr)");
});

test("Indeed: a bare link becomes the job's own page", () => {
  const p = parsePaste("https://ca.indeed.com/jobs?q=it&l=Vancouver%2C+BC&vjk=00112233445566aa");
  assert.equal(p.url, "https://ca.indeed.com/viewjob?jk=00112233445566aa");
  assert.equal(p.source, "Indeed");
  assert.equal(p.company, "");
});

test("indeedKey and jobRef identify the same job across link styles", () => {
  assert.equal(indeedKey("https://ca.indeed.com/?vjk=0123456789ABCDEF"), "0123456789abcdef");
  assert.equal(indeedKey("https://ca.indeed.com/viewjob?jk=0123456789abcdef&from=serp"), "0123456789abcdef");
  assert.equal(indeedKey("https://www.linkedin.com/jobs/view/4000000004/"), "");
  assert.deepEqual(jobRef("https://ca.indeed.com/viewjob?jk=0123456789abcdef"), { site: "Indeed", id: "0123456789abcdef" });
  assert.deepEqual(jobRef("https://www.linkedin.com/jobs/view/4000000004/"), { site: "LinkedIn", id: "4000000004" });
  assert.equal(jobRef("https://jobs.example.com/postings/1234"), null);
});
