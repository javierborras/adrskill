#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const KIT_ROOT = path.resolve(__dirname, "..");
const SKILL_NAMES = ["adr-orchestrator", "doc-keeper"];
const DOCS_DIRS = [
  "docs/current",
  "docs/archive",
  "docs/adr/proposed",
  "docs/adr/in-progress",
  "docs/adr/done",
  "docs/adr/deferred",
];
const SECTION_START = "<!-- docskills:start -->";
const SECTION_END = "<!-- docskills:end -->";
const SECTION_RE = /<!-- docskills:start -->[\s\S]*?<!-- docskills:end -->/;
const ADAPTER_FILES = [
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".codex-plugin/plugin.json",
  ".github/plugin/plugin.json",
  ".github/plugin/marketplace.json",
];

const MESSAGES = {
  en: {
    language: "English (en)",
    hostsTitle: "Hosts",
    filesTitle: "Files",
    skillsTitle: "How to trigger skills",
    skillsHint:
      'Say: "use adr-orchestrator", "intake this ADR", "inspect the portfolio", "run phase 2 of 019", "handoff", "close the ADR", "doc-keeper before commit".',
    adrOrchestrator: "intake, portfolio, phase execution, validation, handoff, closeout",
    docKeeper: "update SSoT, register ADRs, archive stale plans before commit",
    installed: "docskills installed",
    cursor: "Cursor          .cursor/skills + .cursor/rules/docskills.mdc",
    claude: "Claude Code     .claude/skills + CLAUDE.md",
    antigravity: "Antigravity     AGENTS.md + .agents/skills",
    copilot: "VS Code Copilot .github/copilot-instructions.md",
  },
  es: {
    language: "Español (es)",
    hostsTitle: "Hosts",
    filesTitle: "Archivos",
    skillsTitle: "Cómo disparar los skills",
    skillsHint:
      'Frases: "usá adr-orchestrator", "ingestá este ADR", "inspeccioná el portafolio", "ejecutá la fase 2 del 019", "handoff", "cerrá el ADR", "doc-keeper antes del commit".',
    adrOrchestrator: "ingesta, portafolio, ejecución por fases, validación, handoff, cierre",
    docKeeper: "actualizar SSoT, registrar ADRs, archivar planes viejos antes del commit",
    installed: "docskills instalado",
    cursor: "Cursor          .cursor/skills + .cursor/rules/docskills.mdc",
    claude: "Claude Code     .claude/skills + CLAUDE.md",
    antigravity: "Antigravity     AGENTS.md + .agents/skills",
    copilot: "VS Code Copilot .github/copilot-instructions.md",
  },
};

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function normalizeLang(value) {
  if (value == null || value === "") return null;
  const raw = String(value).trim().toLowerCase();
  if (raw === "en" || raw === "english") return "en";
  if (raw === "es" || raw === "spanish" || raw === "español" || raw === "espanol") return "es";
  return false;
}

function wrapSection(inner) {
  return `${SECTION_START}\n${String(inner).trim()}\n${SECTION_END}\n`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeUtf8(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isFile()) copyFile(from, to);
  }
}

function upsertDelimited(filePath, inner) {
  const block = wrapSection(inner);
  if (!fs.existsSync(filePath)) {
    writeUtf8(filePath, block);
    return "created";
  }
  const existing = readUtf8(filePath);
  if (SECTION_RE.test(existing)) {
    writeUtf8(filePath, existing.replace(SECTION_RE, `${SECTION_START}\n${String(inner).trim()}\n${SECTION_END}`));
    return "updated";
  }
  const prefix = existing.endsWith("\n") ? existing : `${existing}\n`;
  writeUtf8(filePath, `${prefix}\n${block}`);
  return "appended";
}

function writeIfMissing(filePath, content) {
  if (fs.existsSync(filePath)) return "kept";
  writeUtf8(filePath, content);
  return "created";
}

function replaceFile(filePath, content) {
  const existed = fs.existsSync(filePath);
  writeUtf8(filePath, content);
  return existed ? "updated" : "created";
}

function ensureAgentsImport(filePath) {
  const needle = "@AGENTS.md";
  if (!fs.existsSync(filePath)) {
    writeUtf8(filePath, `${needle}\n`);
    return "created";
  }
  const text = readUtf8(filePath);
  if (text.includes(needle)) return "kept";
  writeUtf8(filePath, `${text.trimEnd()}\n\n${needle}\n`);
  return "updated";
}

function isSymlink(filePath) {
  try {
    return fs.lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

function removeSymlink(filePath) {
  try {
    if (isSymlink(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function mirrorDir(src, dest) {
  ensureDir(path.dirname(dest));
  if (isSymlink(dest)) {
    try {
      const current = fs.readlinkSync(dest);
      const resolved = path.isAbsolute(current) ? current : path.resolve(path.dirname(dest), current);
      if (path.resolve(resolved) === path.resolve(src)) return "linked";
    } catch {
      // recreate below
    }
    removeSymlink(dest);
  } else if (fs.existsSync(dest)) {
    copyDir(src, dest);
    return "copied";
  }

  try {
    if (process.platform === "win32") {
      fs.symlinkSync(src, dest, "junction");
    } else {
      fs.symlinkSync(path.relative(path.dirname(dest), src) || ".", dest);
    }
    return "linked";
  } catch {
    copyDir(src, dest);
    return "copied";
  }
}

function adapterName(filePath) {
  try {
    const json = JSON.parse(readUtf8(filePath));
    return json.name || (json.plugins && json.plugins[0] && json.plugins[0].name) || null;
  } catch {
    return null;
  }
}

function copyAdapter(kitRoot, target, relativePath) {
  const src = path.join(kitRoot, relativePath);
  const dest = path.join(target, relativePath);
  if (!fs.existsSync(src)) return null;
  if (fs.existsSync(dest)) {
    const name = adapterName(dest);
    if (name && name !== "docskills") return "skipped";
  }
  copyFile(src, dest);
  return fs.existsSync(dest) ? "copied" : null;
}

function localePath(kitRoot, lang, ...parts) {
  return path.join(kitRoot, "locales", lang, ...parts);
}

function record(files, relativePath, action) {
  files.push({ path: toPosix(relativePath), action });
}

function install(options) {
  const lang = normalizeLang(options.lang);
  if (lang === false) {
    throw new Error(`Unknown language: ${options.lang}. Use en or es.`);
  }
  if (!lang) {
    throw new Error("Language is required (en or es).");
  }

  const kitRoot = options.kitRoot ? path.resolve(options.kitRoot) : KIT_ROOT;
  const target = path.resolve(options.dir || options.target || process.cwd());
  const localeRoot = path.join(kitRoot, "locales", lang);
  if (!fs.existsSync(path.join(localeRoot, "AGENTS.md"))) {
    throw new Error(`Locale not found: ${toPosix(path.relative(kitRoot, localeRoot))}`);
  }

  ensureDir(target);
  const files = [];

  for (const skillName of SKILL_NAMES) {
    const destSkill = path.join(target, ".agents", "skills", skillName);
    const localeSkill = localePath(kitRoot, lang, "agents", "skills", skillName);
    copyDir(localeSkill, destSkill);
    record(files, path.join(".agents", "skills", skillName), "updated");

    const sharedScripts = path.join(kitRoot, ".agents", "skills", skillName, "scripts");
    if (fs.existsSync(sharedScripts)) {
      copyDir(sharedScripts, path.join(destSkill, "scripts"));
    }

    for (const host of [".cursor", ".claude"]) {
      const mirror = path.join(target, host, "skills", skillName);
      const action = mirrorDir(destSkill, mirror);
      record(files, path.join(host, "skills", skillName), action);
    }
  }

  for (const dir of DOCS_DIRS) {
    const destDir = path.join(target, dir);
    const existed = fs.existsSync(destDir);
    ensureDir(destDir);
    record(files, dir, existed ? "kept" : "created");
  }

  const indexTemplate = readUtf8(localePath(kitRoot, lang, "templates", "adr-index-template.md"));
  record(files, path.join("docs", "adr", "000-index.md"), writeIfMissing(path.join(target, "docs", "adr", "000-index.md"), indexTemplate));

  const northStarLive = readUtf8(localePath(kitRoot, lang, "docs", "current", "north-star.md"));
  record(
    files,
    path.join("docs", "current", "north-star.md"),
    writeIfMissing(path.join(target, "docs", "current", "north-star.md"), northStarLive),
  );

  for (const name of ["adr-template.md", "adr-index-template.md"]) {
    const dest = path.join(target, "templates", name);
    copyFile(localePath(kitRoot, lang, "templates", name), dest);
    record(files, path.join("templates", name), "updated");
  }

  record(
    files,
    "AGENTS.md",
    upsertDelimited(path.join(target, "AGENTS.md"), readUtf8(localePath(kitRoot, lang, "AGENTS.md"))),
  );
  record(files, "CLAUDE.md", ensureAgentsImport(path.join(target, "CLAUDE.md")));
  record(
    files,
    path.join(".github", "copilot-instructions.md"),
    upsertDelimited(
      path.join(target, ".github", "copilot-instructions.md"),
      readUtf8(localePath(kitRoot, lang, "github", "copilot-instructions.md")),
    ),
  );
  record(
    files,
    path.join(".agents", "rules", "north-star-research-and-design.md"),
    replaceFile(
      path.join(target, ".agents", "rules", "north-star-research-and-design.md"),
      readUtf8(localePath(kitRoot, lang, "agents", "rules", "north-star-research-and-design.md")),
    ),
  );
  record(
    files,
    path.join(".cursor", "rules", "docskills.mdc"),
    replaceFile(
      path.join(target, ".cursor", "rules", "docskills.mdc"),
      readUtf8(localePath(kitRoot, lang, "cursor", "rules", "docskills.mdc")),
    ),
  );

  const geminiPath = path.join(target, "GEMINI.md");
  if (fs.existsSync(geminiPath)) {
    record(files, "GEMINI.md", ensureAgentsImport(geminiPath));
  }

  for (const relative of ADAPTER_FILES) {
    const action = copyAdapter(kitRoot, target, relative);
    if (action) record(files, relative, action);
  }

  const summary = formatSummary({ lang, target, files });
  if (options.silent !== true) {
    process.stdout.write(`${summary}\n`);
  }
  return { lang, target, files, summary };
}

function formatSummary({ lang, target, files }) {
  const msg = MESSAGES[lang];
  const lines = [
    msg.installed,
    "",
    `Language / Idioma: ${msg.language}`,
    `Target: ${target}`,
    "",
    `${msg.hostsTitle}:`,
    `  ${msg.cursor}`,
    `  ${msg.claude}`,
    `  ${msg.antigravity}`,
    `  ${msg.copilot}`,
    "",
    `${msg.filesTitle}:`,
  ];
  for (const file of files) {
    lines.push(`  ${file.action.padEnd(9)} ${file.path}`);
  }
  lines.push(
    "",
    `${msg.skillsTitle}:`,
    `  adr-orchestrator  ${msg.adrOrchestrator}`,
    `  doc-keeper        ${msg.docKeeper}`,
    `  ${msg.skillsHint}`,
  );
  return lines.join("\n");
}

module.exports = {
  KIT_ROOT,
  SKILL_NAMES,
  SECTION_START,
  SECTION_END,
  install,
  normalizeLang,
  formatSummary,
};

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    let lang = null;
    let dir = process.cwd();
    for (let i = 0; i < args.length; i += 1) {
      const arg = args[i];
      if (arg === "--lang" || arg === "--locale" || arg === "-l") lang = args[++i];
      else if (arg.startsWith("--lang=")) lang = arg.slice("--lang=".length);
      else if (arg.startsWith("--locale=")) lang = arg.slice("--locale=".length);
      else if (arg === "--dir") dir = args[++i];
      else if (arg.startsWith("--dir=")) dir = arg.slice("--dir=".length);
    }
    install({ lang: lang || "en", dir });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
