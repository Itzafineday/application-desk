// Tests for the checks the workflows run on Claude's output before it is
// posted, pushed or released (.github/scripts/ci.js). The "secrets" here are
// made-up strings in the right shape, not real credentials.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { findSecrets, checkTriage, patchPaths, protectedPaths, checkPr } = require("../.github/scripts/ci.js");

const FAKE_KEY = "sk-ant-" + "api03-" + "x".repeat(24);            // built up so no scanner sees a key here
const FAKE_GH = "gh" + "s_" + "A".repeat(36);

test("findSecrets spots API keys and tokens, and nothing in ordinary text", () => {
  assert.equal(findSecrets("Thanks! The cause is in public/index.html:1234.").length, 0);
  assert.equal(findSecrets("key: " + FAKE_KEY).length, 1);
  assert.equal(findSecrets("token " + FAKE_GH).length, 1);
  assert.equal(findSecrets("-----BEGIN OPENSSH PRIVATE KEY-----").length, 1);
});

test("checkTriage keeps only the fields each action allows", () => {
  assert.deepEqual(checkTriage({ action: "plan", kind: "bug", comment: " A plan. ", extra: "dropped" }),
    { action: "plan", kind: "bug", comment: "A plan." });
  assert.deepEqual(checkTriage({ action: "duplicate", duplicate_of: 12, comment: "Same as #12." }),
    { action: "duplicate", duplicate_of: 12, comment: "Same as #12." });
  assert.deepEqual(checkTriage({ action: "needs-info", comment: "Which browser?" }),
    { action: "needs-info", comment: "Which browser?" });
});

test("checkTriage refuses anything else", () => {
  assert.throws(() => checkTriage({ action: "close", comment: "x" }), /unknown action/);
  assert.throws(() => checkTriage({ action: "approved", comment: "x" }), /unknown action/);   // can't approve itself
  assert.throws(() => checkTriage({ action: "plan", comment: "x" }), /kind/);
  assert.throws(() => checkTriage({ action: "duplicate", duplicate_of: "12; rm -rf /", comment: "x" }), /issue number/);
  assert.throws(() => checkTriage({ action: "plan", kind: "bug", comment: "here: " + FAKE_KEY }), /secret/);
  assert.throws(() => checkTriage({ action: "plan", kind: "bug", comment: "x".repeat(7000) }), /longer/);
  assert.throws(() => checkTriage([]), /not an object/);
});

test("patchPaths and protectedPaths read a git diff", () => {
  const patch = [
    "diff --git a/public/index.html b/public/index.html", "--- a/public/index.html", "+++ b/public/index.html",
    "@@ -1 +1 @@", "-old", "+new",
    "diff --git a/tests/new.test.js b/tests/new.test.js", "--- /dev/null", "+++ b/tests/new.test.js",
  ].join("\n");
  assert.deepEqual(patchPaths(patch).sort(), ["public/index.html", "tests/new.test.js"]);
  assert.deepEqual(protectedPaths(patch), []);
  const sneaky = "diff --git a/.github/workflows/tests.yml b/.github/workflows/tests.yml\n"
    + "diff --git a/docs/x.md b/.githooks/pre-commit\nrename from docs/x.md\nrename to .githooks/pre-commit\n"
    + "diff --git a/../outside b/../outside\n";
  assert.deepEqual(protectedPaths(sneaky).sort(), ["../outside", ".githooks/pre-commit", ".github/workflows/tests.yml"]);
});

test("checkPr keeps a one-line title and always closes the issue", () => {
  assert.deepEqual(checkPr({ title: " Fix the Indeed pay range ", body: "What changed." }, 7),
    { title: "Fix the Indeed pay range", body: "What changed.\n\nFixes #7\n" });
  assert.throws(() => checkPr({ title: "Two\nlines", body: "x" }, 7), /one line/);
  assert.throws(() => checkPr({ title: "x".repeat(101), body: "x" }, 7), /one line/);
  assert.throws(() => checkPr({ title: "Fix", body: "" }, 7), /body/);
  assert.throws(() => checkPr({ title: "Fix", body: FAKE_GH }, 7), /secret/);
  assert.throws(() => checkPr({ title: "Fix", body: "x" }, NaN), /issue/);
});
