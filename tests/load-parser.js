// Loads parts of the page's script straight out of public/index.html, so the
// tests run against the code that ships, with no build step or copy to keep
// in sync.
"use strict";
const fs = require("fs");
const path = require("path");

// The code between two markers in the page, with the named functions returned.
// `globals` stands in for what that code expects from the browser or from
// other sections, as { name: value }.
function loadSection(startMarker, endMarker, names, globals = {}) {
  const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  if (start < 0 || end < start) throw new Error(`section "${startMarker}" not found in public/index.html`);
  return new Function(...Object.keys(globals), html.slice(start, end) +
    "\nreturn { " + names.map((n) => n + ": " + n).join(", ") + " };")(...Object.values(globals));
}

module.exports = function loadParser() {
  return loadSection("/* ============================ paste parser", "function showPreview(){",
    ["parsePaste", "linkedinId", "indeedKey", "jobRef", "findDuplicate"]);
};
module.exports.loadSection = loadSection;
