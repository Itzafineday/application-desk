// Resume reader tests. Run with: node --test tests/
// Fixtures are invented resumes laid out like a paste, a PDF read by pdf.js,
// and a Word file read by mammoth.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadSection } = require("./load-parser");

const { parseResume, pdfPageText } = loadSection(
  "/* ============================ resume reader", "/* ============================ get started",
  ["parseResume", "pdfPageText"]);

const fixture = (name) => fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");

test("Resume: pasted text with capital headings, a headline line and bullets", () => {
  const r = parseResume(fixture("resume-pasted.txt"));
  assert.equal(r.name, "Jordan Example");                // all caps read as a name
  assert.equal(r.headline, "Systems Administrator | Hybrid Cloud, Identity and Automation");
  assert.equal(r.skills.split("\n").length, 6);
  assert.equal(r.skills.split("\n")[1], "Linux (Ubuntu, RHEL), Bash, PowerShell");
  assert.equal(r.experience, [
    "Systems Administrator",
    "Mossbank Freight Lines, Example City, BC | 2022 - present",
    "- Run 140 virtual servers across two sites and an Azure tenant for 600 staff.",
    "- Moved server builds to Terraform and Ansible, cutting a new server from two days to an hour.",
    "- Rolled out conditional access and phishing-resistant sign-in for all staff.",
    "",
    "IT Support Analyst",
    "Rainshadow College, Example City, BC | 2019 - 2022",
    "- First and second line support for 1,200 staff and students.",
    "- Wrote the PowerShell scripts that automated account setup and leavers.",
    "- Led the move of 300 laptops to Intune.",
  ].join("\n"));
  assert.doesNotMatch(r.experience, /Diploma|Azure Administrator/);   // education and certificates stay out
});

test("Resume: the demo profile is what Get started makes of the same resume", () => {
  const sample = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "public", "sample-data.json"), "utf8"));
  const r = parseResume(sample.profile.resume);
  assert.equal(sample.profile.resume, fixture("resume-pasted.txt").trim());
  for (const f of ["name", "headline", "skills", "experience"]) assert.equal(sample.profile[f], r[f], f);
});

test("Resume: PDF text with spaced-out headings, symbol bullets and wrapped lines", () => {
  const r = parseResume(fixture("resume-pdf-text.txt"));
  assert.equal(r.name, "Riley Sample");                  // contact details on the same line are dropped
  assert.equal(r.headline, "Network analyst who keeps small offices online.");   // from the summary
  assert.equal(r.skills, "Cisco, Meraki, Fortinet, Windows Server\nMicrosoft 365, Vendor management, Documentation");
  assert.equal(r.experience, [
    "Network Analyst, Prairie Example Health Clinics",
    "2021 – Present",
    "- Replaced the wireless network in nine clinics over one summer, with no lost clinic days.",
    "- Cut help desk tickets by a third by writing setup guides staff could follow.",
    "",
    "Help Desk Lead, Example Town School Division",
    "2017 – 2021",
    "- Ran a team of four technicians supporting 3,000 students and staff.",
  ].join("\n"));
});

test("Resume: Word text with a title line, other heading names and volunteer work", () => {
  const r = parseResume(fixture("resume-word-text.txt"));
  assert.equal(r.name, "Sam Q. Fictional");
  assert.equal(r.headline, "Bookkeeper and office manager");
  assert.equal(r.skills, "Accounts payable and receivable\nPayroll for up to 40 staff\nMonth-end close");
  assert.match(r.experience, /^Office Manager\nExample Lane Dental, 2019 to now\n- Took/);
  assert.match(r.experience, /staff\.\n\nBookkeeper\n/);
  assert.doesNotMatch(r.experience, /Treasurer|request/);
});

test("Resume: text without headings still gives a name and headline", () => {
  const r = parseResume("Alex Placeholder\nWarehouse lead\nalex@example.com\nI have run a warehouse floor for five years.");
  assert.equal(r.name, "Alex Placeholder");
  assert.equal(r.headline, "Warehouse lead");
  assert.equal(r.skills, "");
  assert.equal(r.experience, "");
  assert.deepEqual(parseResume(""), { name: "", headline: "", skills: "", experience: "" });
});

test("pdfPageText joins items on a line and breaks where the baseline moves", () => {
  const item = (str, x, y, width, hasEOL) => ({ str, transform: [10, 0, 0, 10, x, y], width, hasEOL: !!hasEOL });
  const text = pdfPageText([
    item("Riley", 50, 700, 30), item("Sample", 84, 700, 40),       // a gap: a space goes between
    item("Net", 50, 680, 18), item("work", 68, 680, 24),            // touching: one word
    { type: "beginMarkedContent" },                                 // not text
    item("Ends here", 50, 660, 60, true), item("", 0, 0, 0, true),
    item("Next", 50, 640, 25),
  ]);
  assert.equal(text, "Riley Sample\nNetwork\nEnds here\n\nNext");
});
