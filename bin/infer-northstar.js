#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const KIT_ROOT = path.resolve(__dirname, "..");
const SKIP_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  ".ProvidersInfo",
  "dist",
  "build",
  "coverage",
  ".next",
  "bin",
  "obj",
  "vendor",
  "__pycache__",
]);

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

function parseInferArgs(argv) {
  const out = {
    command: null,
    goal: null,
    doc: null,
    paths: [],
    dryRun: true,
    write: false,
    dir: process.cwd(),
    lang: null,
    help: false,
    unknown: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const lower = String(arg).toLowerCase();
    if (lower === "infer-northstar") out.command = "infer-northstar";
    else if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--goal") out.goal = argv[++i];
    else if (arg.startsWith("--goal=")) out.goal = arg.slice("--goal=".length);
    else if (arg === "--doc") out.doc = argv[++i];
    else if (arg.startsWith("--doc=")) out.doc = arg.slice("--doc=".length);
    else if (arg === "--paths") {
      const value = argv[++i];
      if (value) out.paths.push(...String(value).split(",").map((p) => p.trim()).filter(Boolean));
    } else if (arg.startsWith("--paths=")) {
      out.paths.push(
        ...arg
          .slice("--paths=".length)
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      );
    } else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--write") {
      out.write = true;
      out.dryRun = false;
    } else if (arg === "--dir") out.dir = argv[++i];
    else if (arg.startsWith("--dir=")) out.dir = arg.slice("--dir=".length);
    else if (arg === "--lang" || arg === "--locale" || arg === "-l") out.lang = argv[++i];
    else if (arg.startsWith("--lang=")) out.lang = arg.slice("--lang=".length);
    else out.unknown.push(arg);
  }
  return out;
}

function hasGateInput(options) {
  const goal = options.goal && String(options.goal).trim();
  const doc = options.doc && String(options.doc).trim();
  const paths = Array.isArray(options.paths) ? options.paths.filter(Boolean) : [];
  return Boolean(goal || doc || paths.length);
}

function gateError(lang) {
  if (lang === "es") {
    return [
      "infer-northstar requiere una puerta de entrada antes de escanear el proyecto:",
      "  (a) --goal \"2-5 oraciones sobre el objetivo del producto\"",
      "  (b) --doc <ruta-a-documento>",
      "  (c) --paths <ruta1,ruta2>",
      "Sin eso no se inicia el recorrido.",
    ].join("\n");
  }
  return [
    "infer-northstar requires a gate before scanning the project:",
    '  (a) --goal "2-5 sentences about the product goal"',
    "  (b) --doc <path-to-doc>",
    "  (c) --paths <path1,path2>",
    "Without that, the traversal does not start.",
  ].join("\n");
}

function warnTraversal(lang) {
  if (lang === "es") {
    return [
      "AVISO: infer-northstar recorrerá rutas indicadas y heurísticas del proyecto",
      "(README*, docs/current/, package.json, *.sln, Cargo.toml, entrypoints) para inferir uso/intención.",
      "El borrador se marca como inferido. Default: vista previa; solo escribe con --write.",
      "",
    ].join("\n");
  }
  return [
    "WARNING: infer-northstar will traverse indicated paths and project heuristics",
    "(README*, docs/current/, package.json, *.sln, Cargo.toml, entrypoints) to infer usage/intent.",
    "The draft is marked as inferred. Default: preview; write only with --write.",
    "",
  ].join("\n");
}

function detectLang(targetRoot, explicit) {
  if (explicit === "es" || explicit === "en") return explicit;
  const agents = path.join(targetRoot, "AGENTS.md");
  if (fs.existsSync(agents)) {
    const text = readUtf8(agents);
    if (/No leer salvo pedido explícito/i.test(text)) return "es";
    if (/Do not read unless explicitly asked/i.test(text)) return "en";
  }
  const north = path.join(targetRoot, "docs", "current", "north-star.md");
  if (fs.existsSync(north) && /Sin Bloqueos|Investigación y Diseño/i.test(readUtf8(north))) return "es";
  return "en";
}

function safeRead(filePath, maxChars = 4000) {
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
    const text = readUtf8(filePath);
    return text.length > maxChars ? `${text.slice(0, maxChars)}\n…` : text;
  } catch {
    return null;
  }
}

function listMatches(root, predicate, { maxDepth = 3, maxFiles = 40 } = {}) {
  const found = [];
  function walk(dir, depth) {
    if (found.length >= maxFiles || depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (found.length >= maxFiles) return;
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
      } else if (entry.isFile() && predicate(entry.name, full)) {
        found.push(full);
      }
    }
  }
  walk(root, 0);
  return found;
}

function collectHeuristicPaths(targetRoot) {
  const files = [];
  const pushIf = (rel) => {
    const full = path.join(targetRoot, rel);
    if (fs.existsSync(full)) files.push(full);
  };

  for (const name of fs.readdirSync(targetRoot)) {
    if (/^readme/i.test(name) && fs.statSync(path.join(targetRoot, name)).isFile()) {
      files.push(path.join(targetRoot, name));
    }
  }

  pushIf("package.json");
  pushIf("Cargo.toml");
  pushIf("pyproject.toml");
  pushIf("go.mod");
  pushIf("Gemfile");
  pushIf("composer.json");

  const docsCurrent = path.join(targetRoot, "docs", "current");
  if (fs.existsSync(docsCurrent)) {
    for (const name of fs.readdirSync(docsCurrent)) {
      const full = path.join(docsCurrent, name);
      if (fs.statSync(full).isFile() && /\.(md|txt)$/i.test(name)) files.push(full);
    }
  }

  files.push(
    ...listMatches(targetRoot, (name) => /\.sln$/i.test(name), { maxDepth: 2, maxFiles: 10 }),
  );
  files.push(
    ...listMatches(
      targetRoot,
      (name, full) =>
        /^(main|index|program|app)\.(js|ts|mjs|cjs|py|go|rs|cs)$/i.test(name) ||
        /[/\\](src|bin)[/\\].*\.(js|ts|cs)$/i.test(full),
      { maxDepth: 3, maxFiles: 15 },
    ),
  );

  return [...new Set(files)];
}

function summarizePackageJson(text) {
  try {
    const json = JSON.parse(text);
    const bits = [];
    if (json.name) bits.push(`name=${json.name}`);
    if (json.description) bits.push(`description=${json.description}`);
    if (json.bin) bits.push(`bin=${typeof json.bin === "string" ? json.bin : Object.keys(json.bin).join(",")}`);
    if (json.scripts) bits.push(`scripts=${Object.keys(json.scripts).slice(0, 8).join(",")}`);
    return bits.join("; ");
  } catch {
    return text.slice(0, 300);
  }
}

function firstParagraphs(text, max = 2) {
  const blocks = String(text || "")
    .split(/\n\s*\n/)
    .map((b) => b.replace(/^#+\s+/gm, "").trim())
    .filter(Boolean);
  return blocks.slice(0, max).join("\n\n").slice(0, 800);
}

function resolveTemplate(lang) {
  const candidates = [
    path.join(KIT_ROOT, "locales", lang, "templates", "north-star-template.md"),
    path.join(KIT_ROOT, "templates", "north-star-template.md"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function renderNorthStar({ lang, goal, docExcerpt, evidence, inferredAt }) {
  const templatePath = resolveTemplate(lang);
  const evidenceLines = evidence
    .map((e) => `- \`${e.relative}\`${e.note ? ` — ${e.note}` : ""}`)
    .join("\n");

  if (lang === "es") {
    const body = `# North Star (inferido)

> **Marca:** borrador **inferido** por \`docskills infer-northstar\` el ${inferredAt}.
> Revisar y editar antes de tratarlo como SSoT definitiva. Preferir corte limpio; no bloquear refactors por retrocompatibilidad.

## Intención de producto

${goal || docExcerpt || "TODO: completar con la intención del producto (2–5 oraciones)."}

## No-goals

- No preservar esquemas, archivos o contratos muertos como blocker de diseño.
- No acumular código zombi ni fallbacks defensivos innecesarios.
- No tratar \`docs/archive/\` como SSoT.

## Principios

1. **Etapa de investigación y diseño:** el criterio vivo manda sobre layouts heredados.
2. **Cero bloqueos por retrocompatibilidad:** desacoplar / simplificar / cortar limpio tiene prioridad.
3. **SSoT viva:** \`docs/current/\` (este archivo incluido) describe el presente; la historia va a ADRs o archive.
4. **Un ADR por decisión:** \`docs/adr/\` con carpetas \`proposed/\`, \`in-progress/\`, \`done/\`, \`deferred/\`.

## Evidencia usada (heurística, no dump ciego)

${evidenceLines || "- (sin archivos leídos)"}

## Checklist rápido

- ¿Mejora desacople, claridad o costo? Avanzar.
- ¿La retrocompatibilidad agrega complejidad? Descartarla y cortar limpio.
- ¿Hay migración? Documentarla en el ADR y ejecutar el cambio.
`;
    if (templatePath) {
      // Prefer generated body; template is documentation of shape.
      return body;
    }
    return body;
  }

  return `# North Star (inferred)

> **Mark:** draft **inferred** by \`docskills infer-northstar\` on ${inferredAt}.
> Review and edit before treating it as final SSoT. Prefer a clean cut; do not block refactors for backwards compatibility.

## Product intent

${goal || docExcerpt || "TODO: complete with the product intent (2–5 sentences)."}

## Non-goals

- Do not treat dead schemas, files, or contracts as design blockers.
- Do not accumulate zombie code or unnecessary defensive fallbacks.
- Do not treat \`docs/archive/\` as SSoT.

## Principles

1. **Research and design stage:** live criterion wins over inherited layouts.
2. **Zero back-compat blockers:** decoupling / simplifying / clean cuts take priority.
3. **Living SSoT:** \`docs/current/\` (this file included) describes the present; history belongs in ADRs or archive.
4. **One ADR per decision:** \`docs/adr/\` with \`proposed/\`, \`in-progress/\`, \`done/\`, \`deferred/\`.

## Evidence used (heuristic, not a blind dump)

${evidenceLines || "- (no files read)"}

## Quick checklist

- Does it improve decoupling, clarity, or cost? Proceed.
- Does backwards compatibility add complexity? Drop it and cut clean.
- Is there a migration? Document it in the ADR and execute the change.
`;
}

function inferNorthstar(options = {}) {
  const targetRoot = path.resolve(options.dir || process.cwd());
  const lang = detectLang(targetRoot, options.lang);
  const writeMode = options.write === true;
  const dryRun = writeMode ? false : options.dryRun !== false;

  process.stderr.write(warnTraversal(lang));

  if (!hasGateInput(options)) {
    throw new Error(gateError(lang));
  }

  const goal = options.goal ? String(options.goal).trim() : "";
  let docExcerpt = "";
  if (options.doc) {
    const docPath = path.resolve(targetRoot, options.doc);
    if (!fs.existsSync(docPath)) {
      throw new Error(`--doc not found: ${options.doc}`);
    }
    docExcerpt = firstParagraphs(safeRead(docPath, 6000) || "");
  }

  const indicated = [];
  for (const rel of options.paths || []) {
    const full = path.resolve(targetRoot, rel);
    if (!fs.existsSync(full)) {
      throw new Error(`--paths entry not found: ${rel}`);
    }
    indicated.push(full);
  }

  const scanRoots = indicated.length ? indicated : [targetRoot];
  const files = [];
  for (const root of scanRoots) {
    if (fs.statSync(root).isFile()) {
      files.push(root);
    } else if (indicated.length) {
      // User-prioritized path: shallow read of markdown/json/toml inside
      files.push(
        ...listMatches(
          root,
          (name) => /\.(md|txt|json|toml|csproj|sln)$/i.test(name) || /^readme/i.test(name),
          { maxDepth: 2, maxFiles: 25 },
        ),
      );
    } else {
      files.push(...collectHeuristicPaths(root));
    }
  }

  // Always include heuristics lightly even when paths given (union, capped)
  if (indicated.length) {
    for (const extra of collectHeuristicPaths(targetRoot)) {
      if (files.length >= 40) break;
      if (!files.includes(extra)) files.push(extra);
    }
  }

  const evidence = [];
  for (const filePath of files.slice(0, 40)) {
    const relative = toPosix(path.relative(targetRoot, filePath));
    const text = safeRead(filePath, 2500);
    if (text == null) continue;
    let note = "";
    if (path.basename(filePath) === "package.json") note = summarizePackageJson(text);
    else if (/^readme/i.test(path.basename(filePath))) note = firstParagraphs(text, 1).replace(/\n/g, " ").slice(0, 160);
    else if (/\.md$/i.test(filePath)) note = firstParagraphs(text, 1).replace(/\n/g, " ").slice(0, 120);
    else note = "entrypoint/manifest";
    evidence.push({ relative, note });
  }

  if (!goal && docExcerpt) {
    // goal left empty; product intent uses doc excerpt
  }

  const inferredAt = new Date().toISOString().slice(0, 10);
  const draft = renderNorthStar({ lang, goal, docExcerpt, evidence, inferredAt });
  const outPath = path.join(targetRoot, "docs", "current", "north-star.md");
  const relativeOut = "docs/current/north-star.md";

  if (writeMode) {
    ensureDir(path.dirname(outPath));
    writeUtf8(outPath, draft);
    const msg =
      lang === "es"
        ? `Escrito ${relativeOut} (inferido). Revisar antes de closeout.`
        : `Wrote ${relativeOut} (inferred). Review before closeout.`;
    if (options.silent !== true) process.stdout.write(`${msg}\n`);
    return { path: outPath, relative: relativeOut, dryRun: false, wrote: true, draft, evidence, lang };
  }

  if (options.silent !== true) {
    process.stdout.write(draft);
    if (!draft.endsWith("\n")) process.stdout.write("\n");
    const hint =
      lang === "es"
        ? `\n---\nVista previa (dry-run). Para escribir: docskills infer-northstar --write …\n`
        : `\n---\nPreview (dry-run). To write: docskills infer-northstar --write …\n`;
    process.stderr.write(hint);
  }

  return { path: outPath, relative: relativeOut, dryRun: true, wrote: false, draft, evidence, lang };
}

const INFER_NORTHSTAR_USAGE = `Usage: docskills infer-northstar (--goal <text> | --doc <path> | --paths <p1,p2>) [--dry-run] [--write] [--dir <path>]

  MANDATORY GATE: warn + require goal, doc, or paths before any scan.
  Default: dry-run preview on stdout. Write docs/current/north-star.md only with --write.
  Scope: indicated paths + heuristics (README*, docs/current/, package.json, *.sln, Cargo.toml, entrypoints).

  node path/to/docskills/bin/cli.js infer-northstar --goal "We build X for Y. Non-goal Z."
  node path/to/docskills/bin/cli.js infer-northstar --doc docs/current/scope.md --dry-run
  node path/to/docskills/bin/cli.js infer-northstar --paths src,README.md --write

Uso: docskills infer-northstar (--goal <texto> | --doc <ruta> | --paths <p1,p2>) [--dry-run] [--write] [--dir <ruta>]

  PUERTA OBLIGATORIA: aviso + goal, doc o paths antes de escanear.
  Default: vista previa. Solo escribe con --write. Marca el borrador como inferido.
`;

module.exports = {
  parseInferArgs,
  inferNorthstar,
  hasGateInput,
  INFER_NORTHSTAR_USAGE,
  KIT_ROOT,
};
