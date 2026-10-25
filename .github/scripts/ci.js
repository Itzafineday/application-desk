#!/usr/bin/env node
// Checks the workflows run on what Claude produced, in jobs that don't hold
// the Anthropic key, before anything is posted, pushed or released. Claude
// writes its result to a file; these decide whether that file is safe to use.
//
//   node .github/scripts/ci.js secrets <file>...    exit 1 if a file holds a secret
//   node .github/scripts/ci.js triage <result.json>  print the checked result as JSON
//   node .github/scripts/ci.js patch <change.patch>  exit 1 if the patch touches a protected path
//   node .github/scripts/ci.js pr <pr.json> <issue>  print the checked pull request title and body
"use strict";
const fs = require("fs");

// Credentials that must never reach a comment, a commit or a release.
const SECRET_PATTERNS = [
  /sk-ant-[A-Za-z0-9_-]{8,}/,                 // Anthropic API keys and tokens
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,              // GitHub tokens
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,                      // AWS access keys
];
function findSecrets(text) {
  return SECRET_PATTERNS.filter((re) => re.test(String(text))).map((re) => re.source);
}

// What triage may ask for. Anything else is refused, whatever Claude wrote.
const TRIAGE_ACTIONS = ["plan", "privacy", "duplicate", "needs-info"];
const MAX_COMMENT = 6000;
function checkTriage(r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) throw new Error("result is not an object");
  if (!TRIAGE_ACTIONS.includes(r.action)) throw new Error("unknown action: " + r.action);
  if (typeof r.comment !== "string" || !r.comment.trim()) throw new Error("comment is missing");
  if (r.comment.length > MAX_COMMENT) throw new Error("comment is longer than " + MAX_COMMENT);
  if (findSecrets(r.comment).length) throw new Error("comment looks like it holds a secret");
  const out = { action: r.action, comment: r.comment.trim() };
  if (r.action === "duplicate") {
    if (!Number.isInteger(r.duplicate_of) || r.duplicate_of < 1) throw new Error("duplicate_of must be an issue number");
    out.duplicate_of = r.duplicate_of;
  }
  if (r.action === "plan") {
    if (r.kind !== "bug" && r.kind !== "enhancement") throw new Error("kind must be bug or enhancement");
    out.kind = r.kind;
  }
  return out;
}

// The files a unified diff changes (both old and new names), and which of
// them a build may not touch: workflows, hooks and git's own files.
const PROTECTED = [/^\.github\//, /^\.githooks\//, /(^|\/)\.git(\/|$)/, /^\.gitattributes$/];
function patchPaths(patch) {
  const paths = new Set();
  String(patch).split("\n").forEach((l) => {
    let m = l.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (m) { paths.add(m[1]); paths.add(m[2]); return; }
    m = l.match(/^(?:---|\+\+\+) [ab]\/(.+)$/) || l.match(/^rename (?:from|to) (.+)$/);
    if (m) paths.add(m[1]);
  });
  return [...paths];
}
function protectedPaths(patch) {
  return patchPaths(patch).filter((p) => PROTECTED.some((re) => re.test(p)) || p.split("/").includes(".."));
}

// The pull request a build proposes: a one-line title and a body, which
// always ends by closing the issue it was built for.
function checkPr(r, issue) {
  if (!r || typeof r !== "object" || Array.isArray(r)) throw new Error("pr.json is not an object");
  if (typeof r.title !== "string" || !r.title.trim() || /[\r\n]/.test(r.title.trim()) || r.title.length > 100) {
    throw new Error("title must be one line of up to 100 characters");
  }
  if (typeof r.body !== "string" || !r.body.trim() || r.body.length > 20000) throw new Error("body is missing or too long");
  if (findSecrets(r.title + "\n" + r.body).length) throw new Error("pull request text looks like it holds a secret");
  if (!Number.isInteger(issue) || issue < 1) throw new Error("issue must be a number");
  return { title: r.title.trim(), body: r.body.trim() + "\n\nFixes #" + issue + "\n" };
}

function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === "secrets" && args.length) {
    let bad = false;
    args.forEach((f) => {
      const hits = findSecrets(fs.readFileSync(f, "utf8"));
      if (hits.length) { bad = true; console.error(`${f}: looks like it holds a secret (${hits.join(", ")})`); }
    });
    process.exit(bad ? 1 : 0);
  } else if (cmd === "triage" && args.length === 1) {
    try {
      console.log(JSON.stringify(checkTriage(JSON.parse(fs.readFileSync(args[0], "utf8")))));
    } catch (e) {
      console.error("triage result refused: " + e.message);
      process.exit(1);
    }
  } else if (cmd === "patch" && args.length === 1) {
    const bad = protectedPaths(fs.readFileSync(args[0], "utf8"));
    if (bad.length) { console.error("the change touches protected paths: " + bad.join(", ")); process.exit(1); }
  } else if (cmd === "pr" && args.length === 2) {
    try {
      console.log(JSON.stringify(checkPr(JSON.parse(fs.readFileSync(args[0], "utf8")), Number(args[1]))));
    } catch (e) {
      console.error("pull request refused: " + e.message);
      process.exit(1);
    }
  } else {
    console.error("usage: ci.js secrets <file>... | triage <result.json> | patch <change.patch> | pr <pr.json> <issue>");
    process.exit(2);
  }
}

if (require.main === module) main();
module.exports = { findSecrets, checkTriage, patchPaths, protectedPaths, checkPr };
