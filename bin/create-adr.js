#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const KIT_ROOT = path.resolve(__dirname, "..");
const ADR_FOLDERS = ["proposed", "in-progress", "done", "deferred"];
const STATUS_ALIASES = {
  proposed: "proposed",
  propuesto: "proposed",
  "in-progress": "in-progress",
  inprogress: "in-progress",
  in_progress: "in-progress",
  "en-curso": "in-progress",
  encuso: "in-progress",
  "en curso": "in-progress",
  deferred: "deferred",
  diferido: "deferred",
  postponed: "deferred",
  done: "done",
  implemented: "done",
  hecho: "done",
};
const STATUS_LABEL = {
  proposed: { en: "Proposed", es: "Propuesto" },
  "in-progress": { en: "In progress", es: "En curso" },
  deferred: { en: "Deferred", es: "Diferido" },
};
const CANONICAL_NAME = /^(\d{3,4})-(.+)\.md$/i;

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
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

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeStatus(raw) {
  if (raw == null || raw === "") return "proposed";
  const key = String(raw).trim().toLowerCase().replace(/_/g, "-");
  const spaced = key.replace(/\s+/g, " ");
  const mapped = STATUS_ALIASES[key] || STATUS_ALIASES[spaced];
  if (!mapped) {
    throw new Error(`Unknown status: ${raw}. Use proposed, in-progress, or deferred.`);
  }
  if (mapped === "done") {
    throw new Error("create-adr never writes to done/. Use proposed, in-progress, or deferred.");
  }
  return mapped;
}

function parseCreateAdrArgs(argv) {
  const out = {
    command: null,
    title: null,
    slug: null,
    status: "proposed",
    from: null,
    dir: process.cwd(),
    help: false,
    unknown: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const lower = String(arg).toLowerCase();
    if (lower === "create-adr") out.command = "create-adr";
    else if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--title") out.title = argv[++i];
    else if (arg.startsWith("--title=")) out.title = arg.slice("--title=".length);
    else if (arg === "--slug") out.slug = argv[++i];
    else if (arg.startsWith("--slug=")) out.slug = arg.slice("--slug=".length);
    else if (arg === "--status") out.status = argv[++i];
    else if (arg.startsWith("--status=")) out.status = arg.slice("--status=".length);
    else if (arg === "--from") out.from = argv[++i];
    else if (arg.startsWith("--from=")) out.from = arg.slice("--from=".length);
    else if (arg === "--dir") out.dir = argv[++i];
    else if (arg.startsWith("--dir=")) out.dir = arg.slice("--dir=".length);
    else out.unknown.push(arg);
  }
  return out;
}

function detectLang(templateText) {
  if (/##\s+Objetivo\b/i.test(templateText) || /##\s+Contexto\b/i.test(templateText)) return "es";
  return "en";
}

function resolveTemplate(targetRoot) {
  const candidates = [
    path.join(targetRoot, "templates", "adr-template.md"),
    path.join(KIT_ROOT, "templates", "adr-template.md"),
    path.join(KIT_ROOT, "locales", "es", "templates", "adr-template.md"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("ADR template not found (templates/adr-template.md).");
}

function resolveIndexTemplate(targetRoot, lang) {
  const candidates = [
    path.join(targetRoot, "templates", "adr-index-template.md"),
    path.join(KIT_ROOT, "locales", lang, "templates", "adr-index-template.md"),
    path.join(KIT_ROOT, "templates", "adr-index-template.md"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("ADR index template not found.");
}

function bootstrapAdrTree(targetRoot, lang) {
  const adrRoot = path.join(targetRoot, "docs", "adr");
  ensureDir(adrRoot);
  for (const folder of ADR_FOLDERS) ensureDir(path.join(adrRoot, folder));
  const indexPath = path.join(adrRoot, "000-index.md");
  if (!fs.existsSync(indexPath)) {
    writeUtf8(indexPath, readUtf8(resolveIndexTemplate(targetRoot, lang)));
  }
  return indexPath;
}

function listAdrIds(adrRoot) {
  const ids = [];
  for (const folder of ADR_FOLDERS) {
    const dir = path.join(adrRoot, folder);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const match = name.match(CANONICAL_NAME);
      if (!match) continue;
      if (/-pendings-/i.test(name)) continue;
      ids.push(Number(match[1]));
    }
  }
  return ids;
}

function nextAdrNumber(adrRoot) {
  const ids = listAdrIds(adrRoot);
  const max = ids.length ? Math.max(...ids) : 0;
  return String(max + 1).padStart(3, "0");
}

function extractSection(markdown, headings) {
  for (const heading of headings) {
    const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i");
    const match = markdown.match(re);
    if (match) return match[1].trim();
  }
  return "";
}

function fillFromSource(sourceText) {
  if (!sourceText) {
    return {
      objective: "",
      nogoals: "",
      context: "",
      decision: "",
      consequences: "",
      exit: "",
    };
  }
  const objective = extractSection(sourceText, ["Objetivo", "Objective", "Goal"]);
  const nogoals = extractSection(sourceText, ["No-goals", "No goals", "Fuera de alcance"]);
  const context = extractSection(sourceText, ["Contexto", "Context"]);
  const decision = extractSection(sourceText, ["Decisión", "Decision"]);
  const consequences = extractSection(sourceText, ["Consecuencias", "Consequences"]);
  const exit = extractSection(sourceText, [
    "Criterio de salida",
    "Criterios de cierre",
    "Exit criteria",
    "Closeout criteria",
  ]);
  const body = [objective, nogoals, context, decision, consequences, exit].some(Boolean)
    ? null
    : sourceText.trim();
  return {
    objective: objective || (body ? body.slice(0, 400) : ""),
    nogoals,
    context: context || (body ? body : ""),
    decision,
    consequences,
    exit,
  };
}

function placeholder(lang, key) {
  const es = {
    objective: "TODO: qué problema se resuelve y para quién.",
    nogoals: "TODO: qué queda fuera de este ADR.",
    context: "TODO: evidencia observada (no supuestos).",
    decision: "TODO: decisión y alternativas descartadas.",
    phase1: "Entregable + cómo se verifica",
    phase2: "Entregable + cómo se verifica",
    exit: "TODO: condiciones observables de cierre.",
    consequences: "TODO: efectos en código, datos y superficies. Si no hay satélite: N/A (<motivo>).",
    prompt1: "Estado: carpeta actual y checkboxes.",
    prompt2: "Siguiente paso concreto (fase 1).",
    prompt4: "Deudas abiertas / stubs.",
  };
  const en = {
    objective: "TODO: what problem this solves and for whom.",
    nogoals: "TODO: what is out of scope for this ADR.",
    context: "TODO: observed evidence (not assumptions).",
    decision: "TODO: decision and discarded alternatives.",
    phase1: "Deliverable + how it is verified",
    phase2: "Deliverable + how it is verified",
    exit: "TODO: observable closeout conditions.",
    consequences: "TODO: effects on code, data, and surfaces. If no satellite: N/A (<reason>).",
    prompt1: "Status: current folder and checkboxes.",
    prompt2: "Concrete next step (phase 1).",
    prompt4: "Open debts / stubs.",
  };
  return (lang === "es" ? es : en)[key];
}

function renderAdr({ nnn, title, slug, status, lang, filled, date }) {
  const label = STATUS_LABEL[status][lang === "es" ? "es" : "en"];
  const orderNote =
    lang === "es"
      ? `${nnn} — después de ADR anteriores (o “primero”)`
      : `${nnn} — after previous ADRs (or “first”)`;
  const phaseLabel = lang === "es" ? "Fase" : "Phase";
  const sections =
    lang === "es"
      ? {
          objective: "Objetivo",
          nogoals: "No-goals",
          context: "Contexto",
          decision: "Decisión",
          phases: "Fases",
          exit: "Criterio de salida",
          consequences: "Consecuencias",
          prompt: "PROMPT PRÓXIMA SESIÓN",
        }
      : {
          objective: "Objective",
          nogoals: "No-goals",
          context: "Context",
          decision: "Decision",
          phases: "Phases",
          exit: "Exit criteria",
          consequences: "Consequences",
          prompt: "NEXT SESSION PROMPT",
        };

  const lines = [
    `# ADR ${nnn}: ${title}`,
    "",
    `- **Status**: ${label} (\`${status}/\`)`,
    `- **Date**: ${date}`,
    `- **Order**: ${orderNote}`,
    "",
    `## ${sections.objective}`,
    "",
    filled.objective || placeholder(lang, "objective"),
    "",
    `## ${sections.nogoals}`,
    "",
    filled.nogoals || placeholder(lang, "nogoals"),
    "",
    `## ${sections.context}`,
    "",
    filled.context || placeholder(lang, "context"),
    "",
    `## ${sections.decision}`,
    "",
    filled.decision || placeholder(lang, "decision"),
    "",
    `## ${sections.phases}`,
    "",
    `- [ ] **${phaseLabel} 1** — ${placeholder(lang, "phase1")}`,
    `- [ ] **${phaseLabel} 2** — ${placeholder(lang, "phase2")}`,
    "",
    lang === "es"
      ? "Usar `[~]` en la fase activa y `[x]` solo tras verificación."
      : "Use `[~]` on the active phase and `[x]` only after verification.",
    "",
    `## ${sections.exit}`,
    "",
    filled.exit || placeholder(lang, "exit"),
    "",
    `## ${sections.consequences}`,
    "",
    filled.consequences || placeholder(lang, "consequences"),
    "",
    `## ${sections.prompt}`,
    "",
    `1. ${placeholder(lang, "prompt1")}`,
    `2. ${placeholder(lang, "prompt2")}`,
    `3. Command: \`node .agents/skills/adr-orchestrator/scripts/validate-adr.js ${nnn}\``,
    `4. ${placeholder(lang, "prompt4")}`,
    "",
  ];
  return lines.join("\n");
}

function updateIndex(indexPath, { nnn, title, status, slug, lang }) {
  let text = readUtf8(indexPath);
  const link = `[${nnn}](${status}/${nnn}-${slug}.md)`;
  const row = `| ${link} | ${title} |`;
  if (text.includes(`${status}/${nnn}-${slug}.md`)) {
    return "kept";
  }

  const sectionHeaders = {
    proposed: lang === "es" ? /^##\s+proposed\/\s*—/im : /^##\s+proposed\/\b/im,
    "in-progress": /^##\s+in-progress\//im,
    deferred: /^##\s+deferred\//im,
  };
  const headerRe = sectionHeaders[status];
  const headerMatch = text.match(headerRe);
  if (!headerMatch) {
    const appendix =
      lang === "es"
        ? `\n\n## ${status}/\n\n| ADR | Título |\n|-----|--------|\n${row}\n`
        : `\n\n## ${status}/\n\n| ADR | Title |\n|-----|-------|\n${row}\n`;
    writeUtf8(indexPath, `${text.trimEnd()}${appendix}`);
    return "appended-section";
  }

  const headerIndex = headerMatch.index;
  const afterHeader = text.slice(headerIndex);
  const nextHeader = afterHeader.slice(headerMatch[0].length).search(/\n##\s+/);
  const sectionEnd = nextHeader === -1 ? text.length : headerIndex + headerMatch[0].length + nextHeader;
  const section = text.slice(headerIndex, sectionEnd);
  const tableRowRe = /^\|[^|\n]+\|[^|\n]+\|\s*$/gm;
  const rows = [...section.matchAll(tableRowRe)];
  if (rows.length >= 2) {
    const lastHeaderRow = rows[1];
    const insertAt = headerIndex + lastHeaderRow.index + lastHeaderRow[0].length;
    text = `${text.slice(0, insertAt)}\n${row}${text.slice(insertAt)}`;
  } else {
    text = `${text.slice(0, sectionEnd).trimEnd()}\n\n| ADR | ${lang === "es" ? "Título" : "Title"} |\n|-----|--------|\n${row}\n${text.slice(sectionEnd)}`;
  }
  // Drop HTML comment placeholder rows for the same slot if present
  text = text.replace(new RegExp(`^\\|\\s*<!--\\s*\\[${nnn}\\].*$`, "gmi"), "");
  writeUtf8(indexPath, text);
  return "updated";
}

function createAdr(options = {}) {
  const targetRoot = path.resolve(options.dir || process.cwd());
  const title = String(options.title || "").trim();
  if (!title) {
    throw new Error("create-adr requires --title <text>.");
  }
  const status = normalizeStatus(options.status);
  let slug = options.slug ? slugify(options.slug) : slugify(title);
  if (/-pendings-/i.test(slug) || slug.includes("pendings")) {
    throw new Error("ADR slug must not contain -pendings- (one file per ADR).");
  }

  const templatePath = resolveTemplate(targetRoot);
  const templateText = readUtf8(templatePath);
  const lang = options.lang || detectLang(templateText);
  const indexPath = bootstrapAdrTree(targetRoot, lang);
  const adrRoot = path.join(targetRoot, "docs", "adr");
  const nnn = options.nnn || nextAdrNumber(adrRoot);
  const fileName = `${nnn}-${slug}.md`;
  if (/-pendings-/i.test(fileName)) {
    throw new Error("Refusing to create companion -pendings- files.");
  }

  let sourceText = "";
  if (options.from) {
    const fromPath = path.resolve(targetRoot, options.from);
    if (!fs.existsSync(fromPath)) {
      throw new Error(`--from not found: ${toPosix(path.relative(targetRoot, fromPath) || fromPath)}`);
    }
    sourceText = readUtf8(fromPath);
  }

  const filled = fillFromSource(sourceText);
  const body = renderAdr({
    nnn,
    title,
    slug,
    status,
    lang,
    filled,
    date: options.date || todayIso(),
  });

  const outPath = path.join(adrRoot, status, fileName);
  if (fs.existsSync(outPath) && options.force !== true) {
    throw new Error(`ADR already exists: ${toPosix(path.relative(targetRoot, outPath))}`);
  }
  writeUtf8(outPath, body);
  const indexAction = updateIndex(indexPath, { nnn, title, status, slug, lang });

  const relative = toPosix(path.relative(targetRoot, outPath));
  const nextStep =
    lang === "es"
      ? `Siguiente paso: usá adr-orchestrator (INTAKE → EXECUTE). Validar con: node .agents/skills/adr-orchestrator/scripts/validate-adr.js ${nnn}`
      : `Next step: use adr-orchestrator (INTAKE → EXECUTE). Validate with: node .agents/skills/adr-orchestrator/scripts/validate-adr.js ${nnn}`;

  const summary = [
    `Created ${relative}`,
    `Index: docs/adr/000-index.md (${indexAction})`,
    nextStep,
  ].join("\n");

  if (options.silent !== true) {
    process.stdout.write(`${summary}\n`);
  }

  return {
    nnn,
    slug,
    status,
    path: outPath,
    relative,
    indexPath,
    indexAction,
    lang,
    summary,
  };
}

const CREATE_ADR_USAGE = `Usage: docskills create-adr --title <text> [--slug <slug>] [--status proposed|in-progress|deferred] [--from <path>] [--dir <path>]

  Alias: create-ADR
  Default status: proposed
  Writes docs/adr/<status>/NNN-slug.md and updates docs/adr/000-index.md
  Never writes to done/. One file per ADR (no -pendings- companions).

  node path/to/docskills/bin/cli.js create-adr --title "Auth via Google" --slug auth-google
  node path/to/docskills/bin/cli.js create-ADR --title "Cache Redis" --status in-progress --from notes.md

Uso: docskills create-adr --title <texto> [--slug <slug>] [--status proposed|in-progress|deferred] [--from <ruta>] [--dir <ruta>]

  Alias: create-ADR
  Status por defecto: proposed
  Nunca escribe en done/. Un archivo por ADR (sin companions -pendings-).
`;

module.exports = {
  parseCreateAdrArgs,
  createAdr,
  normalizeStatus,
  slugify,
  nextAdrNumber,
  CREATE_ADR_USAGE,
  KIT_ROOT,
};
