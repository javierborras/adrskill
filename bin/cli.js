#!/usr/bin/env node

"use strict";

const readline = require("readline");
const { install, normalizeLang } = require("../scripts/install.js");

const USAGE = `Usage: docskills init [--lang en|es] [--dir <path>]

  --lang, --locale, -l   Instruction language (en or es)
  --dir                  Target project (default: current directory)

  node path/to/docskills/bin/cli.js init --lang es
  node path/to/docskills/bin/cli.js init --lang en
  npx --yes path/to/docskills init --lang es

If --lang is omitted and stdin is a TTY, you will be prompted.
If --lang is omitted and stdin is not a TTY, language defaults to en.

Uso: docskills init [--lang en|es] [--dir <ruta>]

Si se omite --lang y hay TTY, se pregunta el idioma.
Si se omite --lang sin TTY, el idioma por defecto es en.
`;

function isTTY() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function parseArgs(argv) {
  const out = { command: null, lang: null, dir: process.cwd(), help: false, unknown: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "init") out.command = "init";
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

async function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.help || parsed.unknown.includes("help")) {
    process.stdout.write(USAGE);
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
