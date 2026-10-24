// Tests for splitting a company form's pasted questions (Help me apply).
// Run with: node --test tests/
// The fixture is an invented form, laid out like a careers page copied as text.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadSection } = require("./load-parser");

const { parseFormQuestions, formLimit } = loadSection(
  "/* ============================ form questions", "/* ============================ events",
  ["parseFormQuestions", "formLimit"]);

const fixture = (name) => fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");

test("Form: a copied careers page gives one question per line, without the form around it", () => {
  assert.deepEqual(parseFormQuestions(fixture("form-careers-page.txt")), [
    "Why do you want to work at Example Co-op Grocers? (max 1000 characters)",
    "Describe a time you solved a problem for a customer. (max 250 words)",
    "Are you legally entitled to work in Canada?",
    "What are your salary expectations?",
    "(optional) Tell us anything else we should know.",
    "Which shifts can you work, e.g. mornings or weekends? (max 500 characters)",
  ]);
});

test("Form: questions already saved on the job are not added again", () => {
  const saved = ["Why do you want to work at Example Co-op Grocers?", "what are your SALARY expectations"];
  const q = parseFormQuestions(fixture("form-careers-page.txt"), saved);
  assert.equal(q.length, 4);
  assert.equal(q[0], "Describe a time you solved a problem for a customer. (max 250 words)");
  // pasting the same form again adds nothing, though saved questions carry their limits
  const first = parseFormQuestions(fixture("form-careers-page.txt"));
  assert.deepEqual(parseFormQuestions(fixture("form-careers-page.txt"), first), []);
  // the counter under a question that was skipped doesn't land on another one
  assert.deepEqual(parseFormQuestions("Tell us about yourself\nWhy us?\n0/500", ["Why us?"]), ["Tell us about yourself"]);
});

test("Form: plain lines stay as they are, and blank or noise-only pastes give nothing", () => {
  assert.deepEqual(parseFormQuestions("  What is your notice period?  \n\nDo you hold a driver's licence"),
    ["What is your notice period?", "Do you hold a driver's licence"]);
  assert.deepEqual(parseFormQuestions("a) First choice of location\nb. Second choice"), ["First choice of location", "Second choice"]);
  assert.deepEqual(parseFormQuestions("Yes\nNo\n0/1000\nSubmit\n\n"), []);
  assert.deepEqual(parseFormQuestions(""), []);
});

test("formLimit reads length limits and nothing else", () => {
  assert.equal(formLimit("0/1000"), "max 1000 characters");
  assert.equal(formLimit("0 / 250 words"), "max 250 words");
  assert.equal(formLimit("(Maximum 1,500 characters)"), "max 1,500 characters");
  assert.equal(formLimit("Characters remaining: 800"), "max 800 characters");
  assert.equal(formLimit("300 words or less"), "max 300 words");
  assert.equal(formLimit("Up to 3 files"), "");
  assert.equal(formLimit("How many years of experience do you have?"), "");
});
