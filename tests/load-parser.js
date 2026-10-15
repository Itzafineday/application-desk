// Loads the paste parser straight out of public/index.html, so the tests run
// against the code that ships, with no build step or copy to keep in sync.
"use strict";
const fs = require("fs");
const path = require("path");

module.exports = function loadParser() {
  const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  const start = html.indexOf("/* ============================ paste parser");
  const end = html.indexOf("function showPreview(){");
  if (start < 0 || end < start) throw new Error("paste parser section not found in public/index.html");
  return new Function(html.slice(start, end) +
    "\nreturn { parsePaste: parsePaste, linkedinId: linkedinId, indeedKey: indeedKey, jobRef: jobRef };")();
};
