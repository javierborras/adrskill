#!/usr/bin/env node

"use strict";

const readline = require("readline");
const { install, normalizeLang } = require("../scripts/install.js");
const { parseCreateAdrArgs, createAdr, CREATE_ADR_USAGE } = require("./create-adr.js");
const { parseInferArgs, inferNorthstar, INFER_NORTHSTAR_USAGE } = require("./infer-northstar.js");

const USAGE = `Usage: docskills <command> [options]

Commands:
  init              Install kit into a project (--lang en|es, --dir)
  create-adr        Create docs/adr/<status>/NNN-slug.md (alias: create-ADR)
  infer-northstar   Infer docs/current/north-star.md (gate: --goal|--doc|--paths)

  node path/to/docskills/bin/cli.js init --lang es
  node path/to/docskills/bin/cli.js create-adr --title "Auth Google" --slug auth-google
  node path/to/docskills/bin/cli.js infer-northstar --goal "Product intent…" --dry-run

Uso: docskills <comando> [opciones]

Comandos:
  init              Instala el kit (--lang en|es, --dir)
  create-adr        Crea docs/adr/<status>/NNN-slug.md (alias: create-ADR)
  infer-northstar   Infiere docs/current/north-star.md (puerta: --goal|--doc|--paths)
`;

function isTTY() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function parseArgs(argv) {
  const out = { command: null, lang: null, dir: process.cwd(), help: false, unknown: [], raw: argv };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const lower = String(arg).toLowerCase();
    if (lower === "init") out.command = "init";
    else if (lower === "create-adr") out.command = "create-adr";
    else if (lower === "infer-northstar") out.command = "infer-northstar";
    else if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--lang" || arg === "--locale" || arg === "-l") out.lang = argv[++i];
    else if (arg.startsWith("--lang=")) out.lang = arg.slice("--lang=".length);
    else if (arg.startsWith("--locale=")) out.lang = arg.slice("--locale=".length);
    else if (arg === "--dir") out.dir = argv[++i];
    else if (arg.startsWith("--dir=")) out.dir = arg.slice("--dir=".length);
    else out.unknown.push(arg);
  }
  return out;
}

function promptLang() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(
      "Language / Idioma:\n  1) English (en)\n  2) Español (es)\nChoice / Opción [1/2]: ",
      (answer) => {
        rl.close();
        const normalized = normalizeLang(answer);
        if (normalized) {
          resolve(normalized);
          return;
        }
        const trimmed = String(answer || "").trim();
        if (trimmed === "2") resolve("es");
        else resolve("en");
      },
    );
  });
}

async function resolveLang(parsed) {
  if (parsed.lang != null && parsed.lang !== "") {
    const normalized = normalizeLang(parsed.lang);
    if (normalized === false) {
      throw new Error(`Unknown language: ${parsed.lang}. Use en or es.`);
    }
    return normalized;
  }
  if (isTTY()) return promptLang();
  return "en";
}

function usageFor(command) {
  if (command === "create-adr") return CREATE_ADR_USAGE;
  if (command === "infer-northstar") return INFER_NORTHSTAR_USAGE;
  return USAGE;
}

async function main(argv) {
  const first = argv[0] ? String(argv[0]).toLowerCase() : "";
  if (first === "create-adr") {
    const parsed = parseCreateAdrArgs(argv);
    if (parsed.help) {
      process.stdout.write(CREATE_ADR_USAGE);
      return 0;
    }
    createAdr({
      title: parsed.title,
      slug: parsed.slug,
      status: parsed.status,
      from: parsed.from,
      dir: parsed.dir,
    });
    return 0;
  }

  if (first === "infer-northstar") {
    const parsed = parseInferArgs(argv);
    if (parsed.help) {
      process.stdout.write(INFER_NORTHSTAR_USAGE);
      return 0;
    }
    inferNorthstar({
      goal: parsed.goal,
      doc: parsed.doc,
      paths: parsed.paths,
      dryRun: parsed.dryRun,
      write: parsed.write,
      dir: parsed.dir,
      lang: parsed.lang,
    });
    return 0;
  }

  const parsed = parseArgs(argv);
  if (parsed.help || parsed.unknown.includes("help")) {
    process.stdout.write(usageFor(parsed.command));
    return 0;
  }
  if (parsed.command !== "init") {
    process.stderr.write(USAGE);
    return 1;
  }
  const lang = await resolveLang(parsed);
  install({ lang, dir: parsed.dir });
  return 0;
}

if (require.main === module) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    },
  );
}

module.exports = { parseArgs, resolveLang, isTTY, main };
