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
const indexPath = path.join(adrRoot, "000-index.md");

const liveFolders = [
  { dir: path.join(adrRoot, "proposed"), status: "proposed" },
  { dir: path.join(adrRoot, "in-progress"), status: "in-progress" },
];
const archiveFolders = [
  { dir: path.join(adrRoot, "done"), status: "done" },
  { dir: path.join(adrRoot, "deferred"), status: "deferred" },
];

const includeArchive = process.argv.includes("--include-archive") || process.argv.includes("--all");
const canonicalAdrName = /^(\d{3,4})-(.+)\.md$/i;

function toPosix(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listFiles(folder, status) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder).flatMap((name) => {
    const match = name.match(canonicalAdrName);
    if (!match) return [];
    const filePath = path.join(folder, name);
    if (!fs.statSync(filePath).isFile()) return [];
    return [{ id: match[1].padStart(3, "0"), originalId: match[1], titleFromName: match[2], status, filePath }];
  });
}

function parseIndex(markdown) {
  const entries = [];
  const linkPattern = /\[([0-9]{3,4})\]\(([^)]+)\)/gi;
  let match;
  while ((match = linkPattern.exec(markdown)) !== null) {
    const target = match[2].split("#")[0].split("?")[0];
    entries.push({
      id: match[1].padStart(3, "0"),
      originalId: match[1],
      target,
      resolvedPath: path.resolve(adrRoot, target),
    });
  }
  return entries;
}

function titleFrom(markdown, fallback) {
  const heading = markdown.match(/^#\s+(?:ADR[- ]?[0-9]{3,4}\s*(?:—|-|:)\s*)?(.+)$/im);
  return heading ? heading[1].trim() : fallback.replace(/-/g, " ");
}

function checkboxCounts(markdown) {
  return {
    done: (markdown.match(/^\s*[-*]\s+\[[xX]\]\s+/gm) || []).length,
    inProgress: (markdown.match(/^\s*[-*]\s+\[~\]\s+/gm) || []).length,
    todo: (markdown.match(/^\s*[-*]\s+\[ \]\s+/gm) || []).length,
  };
}

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

function main() {
  if (!fs.existsSync(indexPath)) throw new Error(`ADR index not found: ${toPosix(indexPath)}`);

  const indexEntries = parseIndex(readText(indexPath));
  const folderSet = includeArchive ? [...liveFolders, ...archiveFolders] : liveFolders;
  const files = folderSet.flatMap(({ dir, status }) => listFiles(dir, status));

  const adrs = files
    .map((file) => {
      const markdown = readText(file.filePath);
      return {
        id: file.originalId,
        title: titleFrom(markdown, file.titleFromName),
        status: file.status,
        path: toPosix(file.filePath),
        phases: checkboxCounts(markdown),
        hasNextSessionPrompt:
          /^(?:##\s+(?:PROMPT PRÓXIMA SESIÓN|Prompt pr[oó]xima sesi[oó]n|NEXT SESSION PROMPT|Next-session prompt))\s*$/im.test(
            markdown,
          ),
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true }));

  const liveFiles = files.filter((file) => file.status === "proposed" || file.status === "in-progress");
  const liveRoots = liveFolders.map(({ dir }) => path.normalize(dir).toLowerCase());
  const indexedLivePaths = new Set(
    indexEntries
      .map((entry) => path.normalize(entry.resolvedPath).toLowerCase())
      .filter((entryPath) => liveRoots.some((root) => entryPath.startsWith(root))),
  );

  const issues = {
    duplicateIds: duplicateValues(files.map((file) => file.id)).sort(),
    indexWithoutFiles: indexEntries
      .filter((entry) => !fs.existsSync(entry.resolvedPath))
      .map((entry) => ({ id: entry.originalId, target: entry.target })),
    filesNotInIndex: liveFiles
      .filter((file) => !indexedLivePaths.has(path.normalize(file.filePath).toLowerCase()))
      .map((file) => ({ id: file.originalId, path: toPosix(file.filePath) })),
  };

  process.stdout.write(`${JSON.stringify({ adrs, issues, archiveIncluded: includeArchive }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stdout.write(`${JSON.stringify({ error: error.message })}\n`);
  process.exitCode = 1;
}
