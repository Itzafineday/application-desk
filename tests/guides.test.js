// Tests for the guide steps (LinkedIn, Indeed, practice interview).
// Run with: node --test tests/
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSection } = require("./load-parser");

const { GUIDES, guideProgress } = loadSection(
  "/* ============================ guides", "/* ============================ events",
  ["GUIDES", "guideProgress"]);

test("Guides: every step has a stable, unique id and says where to go", () => {
  assert.deepEqual(Object.keys(GUIDES), ["linkedin", "indeed", "interview"]);
  for (const [name, def] of Object.entries(GUIDES)) {
    const ids = def.steps.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, name + " has a repeated step id");
    for (const st of def.steps) {
      assert.match(st.id, /^[a-z]+$/, name + "/" + st.id);
      assert.ok(st.title && st.where, name + "/" + st.id + " needs a title and where");
    }
    if (def.kind === "profile") assert.match(def.site, /^https:\/\//);
  }
});

test("guideProgress counts done and skipped steps and finds the first left", () => {
  const def = GUIDES.indeed;
  assert.deepEqual(guideProgress(def, null), { done: 0, skipped: 0, total: 5, next: 0, finished: false });
  const g = { status: { resume: "done", summary: "skipped", qualifications: "todo", preferences: "done" } };
  assert.deepEqual(guideProgress(def, g), { done: 2, skipped: 1, total: 5, next: 2, finished: false });
  const all = { status: Object.fromEntries(def.steps.map((s) => [s.id, "done"])) };
  assert.deepEqual(guideProgress(def, all), { done: 5, skipped: 0, total: 5, next: 0, finished: true });
});
