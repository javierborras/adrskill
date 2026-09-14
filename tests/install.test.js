"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const kitRoot = path.resolve(__dirname, "..");
const cli = path.join(kitRoot, "bin", "cli.js");

function read(dir, ...parts) {
  return fs.readFileSync(path.join(dir, ...parts), "utf8");
}

function exists(dir, ...parts) {
  return fs.existsSync(path.join(dir, ...parts));
}

function runInit(dir, extraArgs = []) {
  return spawnSync(process.execPath, [cli, "init", "--dir", dir, ...extraArgs], {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function makeTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test("init --lang en writes English instructions, docs tree, and skill mirrors", () => {
  const dir = makeTemp("docskills-en-");
  const result = runInit(dir, ["--lang", "en"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /English \(en\)/);

  const agents = read(dir, "AGENTS.md");
  assert.match(agents, /<!-- docskills:start -->/);
  assert.match(agents, /Do not read unless explicitly asked/);
  assert.match(agents, /<!-- docskills:end -->/);

  const skill = read(dir, ".agents", "skills", "adr-orchestrator", "SKILL.md");
  assert.match(skill, /^name: adr-orchestrator$/m);
  assert.match(skill, /Orchestrates ADR intake/);

  const keeper = read(dir, ".agents", "skills", "doc-keeper", "SKILL.md");
  assert.match(keeper, /^name: doc-keeper$/m);
  assert.match(keeper, /Keeps SSoT documentation current/);

  assert.match(read(dir, "CLAUDE.md"), /@AGENTS\.md/);
  assert.match(read(dir, ".github", "copilot-instructions.md"), /Instructions for VS Code Copilot/);
  assert.match(read(dir, ".cursor", "rules", "docskills.mdc"), /alwaysApply: true/);
  assert.match(read(dir, "docs", "adr", "000-index.md"), /ADR index/);
  assert.match(read(dir, "docs", "current", "north-star.md"), /No Back-Compat Blockers/);
  assert.match(read(dir, "templates", "adr-template.md"), /## Objective/);

  for (const folder of ["proposed", "in-progress", "done", "deferred"]) {
    assert.ok(exists(dir, "docs", "adr", folder), `missing docs/adr/${folder}`);
  }
  assert.ok(exists(dir, "docs", "archive"));
  assert.ok(exists(dir, ".agents", "skills", "adr-orchestrator", "scripts", "inspect-adrs.js"));
  assert.ok(exists(dir, ".cursor", "skills", "adr-orchestrator", "SKILL.md"));
  assert.ok(exists(dir, ".claude", "skills", "doc-keeper", "SKILL.md"));
  assert.match(read(dir, ".cursor", "skills", "adr-orchestrator", "SKILL.md"), /Orchestrates ADR intake/);
  assert.ok(exists(dir, ".claude-plugin", "plugin.json"));
  assert.ok(exists(dir, ".codex-plugin", "plugin.json"));
  assert.ok(exists(dir, ".github", "plugin", "plugin.json"));
});

test("init --lang es writes Spanish instructions", () => {
  const dir = makeTemp("docskills-es-");
  const result = runInit(dir, ["--lang", "es"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Español \(es\)/);
  assert.match(read(dir, "AGENTS.md"), /No leer salvo pedido explícito/);
  assert.match(read(dir, ".agents", "skills", "adr-orchestrator", "SKILL.md"), /Orquesta la ingesta/);
  assert.match(read(dir, ".agents", "skills", "doc-keeper", "SKILL.md"), /Mantiene la documentación SSoT/);
  assert.match(read(dir, "docs", "adr", "000-index.md"), /Índice ADR/);
});

test("init --locale and -l are accepted", () => {
  const dirLocale = makeTemp("docskills-locale-");
  const localeResult = runInit(dirLocale, ["--locale", "en"]);
  assert.equal(localeResult.status, 0, localeResult.stderr);
  assert.match(read(dirLocale, "AGENTS.md"), /Do not read unless explicitly asked/);

  const dirShort = makeTemp("docskills-l-");
  const shortResult = runInit(dirShort, ["-l", "es"]);
  assert.equal(shortResult.status, 0, shortResult.stderr);
  assert.match(read(dirShort, "AGENTS.md"), /No leer salvo pedido explícito/);
});

test("missing --lang in non-TTY defaults to en", () => {
  const dir = makeTemp("docskills-default-");
  const result = runInit(dir, []);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /English \(en\)/);
  assert.match(read(dir, "AGENTS.md"), /Do not read unless explicitly asked/);
  assert.doesNotMatch(read(dir, "AGENTS.md"), /No leer salvo pedido explícito/);
});

test("re-run is idempotent and does not wipe existing ADRs or project AGENTS.md", () => {
  const dir = makeTemp("docskills-rerun-");
  fs.mkdirSync(path.join(dir, "docs", "adr", "proposed"), { recursive: true });
  const adrPath = path.join(dir, "docs", "adr", "proposed", "001-keep-me.md");
  const adrBody = "# ADR 001: Keep me\n\nExisting project ADR. Do not wipe.\n";
  fs.writeFileSync(adrPath, adrBody, "utf8");
  fs.writeFileSync(path.join(dir, "AGENTS.md"), "Project-specific agent rules.\n", "utf8");
  fs.writeFileSync(path.join(dir, "docs", "adr", "000-index.md"), "# Custom index\n", "utf8");

  const first = runInit(dir, ["--lang", "en"]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(fs.readFileSync(adrPath, "utf8"), adrBody);
  const agentsAfterFirst = read(dir, "AGENTS.md");
  assert.match(agentsAfterFirst, /Project-specific agent rules/);
  assert.match(agentsAfterFirst, /Do not read unless explicitly asked/);
  assert.equal(read(dir, "docs", "adr", "000-index.md"), "# Custom index\n");

  const second = runInit(dir, ["--lang", "es"]);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(fs.readFileSync(adrPath, "utf8"), adrBody);
  const agentsAfterSecond = read(dir, "AGENTS.md");
  assert.match(agentsAfterSecond, /Project-specific agent rules/);
  assert.match(agentsAfterSecond, /No leer salvo pedido explícito/);
  assert.doesNotMatch(agentsAfterSecond, /Do not read unless explicitly asked/);
  assert.equal(read(dir, "docs", "adr", "000-index.md"), "# Custom index\n");
  assert.equal((agentsAfterSecond.match(/<!-- docskills:start -->/g) || []).length, 1);
});

test("unknown --lang fails", () => {
  const dir = makeTemp("docskills-badlang-");
  const result = runInit(dir, ["--lang", "fr"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown language/);
});
