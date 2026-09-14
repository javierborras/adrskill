#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

function findRepoRoot(startDir) {
  let curr = startDir;
  while (curr && curr !== path.parse(curr).root) {
    if (fs.existsSync(path.join(curr, "docs", "adr", "000-index.md"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  const fromCwd = process.cwd();
  if (fs.existsSync(path.join(fromCwd, "docs", "adr", "000-index.md"))) {
    return fromCwd;
  }
  return path.resolve(startDir, "../../../..");
}

const repoRoot = findRepoRoot(__dirname);
const adrRoot = path.join(repoRoot, "docs", "adr");
const searchFolders = ["proposed", "in-progress", "done", "deferred"].map((name) => path.join(adrRoot, name));
const input = process.argv[2];

function toPosix(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function fail(message, details = {}) {
  process.stdout.write(`${JSON.stringify({ valid: false, error: message, ...details }, null, 2)}\n`);
  process.exitCode = 1;
}

function resolveInput(value) {
  if (!value) {
    return { error: "Usage: validate-adr.js <ADR-path-or-ID> (e.g. 019 or docs/adr/in-progress/019-*.md)" };
  }

  const directPath = path.resolve(repoRoot, value);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return { filePath: directPath };
  }

  if (!/^\d{1,4}$/.test(value)) return { error: `ADR path or ID not found: ${value}` };

  const matches = [];
  for (const folder of searchFolders) {
    if (!fs.existsSync(folder)) continue;
    for (const name of fs.readdirSync(folder)) {
      if (new RegExp(`^0*${parseInt(value, 10)}-.+\\.md$`, "i").test(name)) {
        matches.push(path.join(folder, name));
      }
    }
  }

  if (matches.length === 0) return { error: `ADR ID not found: ${value}` };
  if (matches.length > 1) return { error: `ADR ID is ambiguous: ${value}`, matches: matches.map(toPosix) };
  return { filePath: matches[0] };
}

function headings(markdown) {
  return [...markdown.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((match) => match[1].trim());
}

function hasHeading(allHeadings, pattern) {
  return allHeadings.some((heading) => pattern.test(heading));
}

function sectionBody(markdown, headingPattern) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => /^#{1,6}\s+/.test(line) && headingPattern.test(line.replace(/^#{1,6}\s+/, "")));
  if (start < 0) return "";
  const level = lines[start].match(/^#+/)[0].length;
  const body = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const nextHeading = lines[index].match(/^(#+)\s+/);
    if (nextHeading && nextHeading[1].length <= level) break;
    body.push(lines[index]);
  }
  return body.join("\n").trim();
}

function main() {
  const resolved = resolveInput(input);
  if (resolved.error) {
    fail(resolved.error, resolved.matches ? { matches: resolved.matches } : {});
    return;
  }

  const markdown = fs.readFileSync(resolved.filePath, "utf8");
  const allHeadings = headings(markdown);
  const required = {
    objetivo: /^(?:Objetivo|Objective|Goal)$/i,
    noGoals: /^(?:No-goals|No goals)$/i,
    decision: /^(?:Decisi[oó]n|Decision)$/i,
    fases: /^(?:Fases|Phases)$/i,
    criterioSalida: /^(?:Criterio de salida|Exit criteria)$/i,
    nextSessionPrompt:
      /^(?:PROMPT PRÓXIMA SESIÓN|Prompt pr[oó]xima sesi[oó]n|NEXT SESSION PROMPT|Next-session prompt)$/i,
  };

  const missingSections = Object.entries(required)
    .filter(([, pattern]) => !hasHeading(allHeadings, pattern))
    .map(([name]) => name);

  const phaseBody = sectionBody(markdown, /^(?:Fases|Phases)$/i);
  const phaseLines = phaseBody.split(/\r?\n/);
  const validCheckboxPattern = /^\s*[-*]\s+\[(?:[xX~]| )\]\s+\S.*$/;
  const checkboxLikePattern = /^\s*[-*]\s*(?:\[[^\]]*\]|\[\s*)/;
  const validCheckboxes = phaseLines.filter((line) => validCheckboxPattern.test(line));
  const malformedCheckboxes = phaseLines
    .filter((line) => checkboxLikePattern.test(line) && !validCheckboxPattern.test(line))
    .map((line) => line.trim());

  const statusPattern =
    /^\s*[-*]?\s*(?:\*\*)?Status(?:\*\*)?:\s*(?:Proposed|Pending|Propuesto|In progress|En curso|Done|Implemented|Hecho|Deferred|Diferido|Superseded|Supersedido|proposed\/|in-progress\/|done\/|deferred\/)/im;
  const statusValid = statusPattern.test(markdown);

  const result = {
    valid: missingSections.length === 0 && validCheckboxes.length > 0 && malformedCheckboxes.length === 0 && statusValid,
    id: path.basename(resolved.filePath).match(/^(\d{3,4})-/)?.[1] ?? null,
    path: toPosix(resolved.filePath),
    missingSections,
    emptyPhases: validCheckboxes.length === 0,
    malformedCheckboxes,
    statusValid,
    phaseCheckboxes: validCheckboxes.length,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.valid) process.exitCode = 1;
}

main();
