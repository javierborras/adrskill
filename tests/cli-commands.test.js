"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const kitRoot = path.resolve(__dirname, "..");
const cli = path.join(kitRoot, "bin", "cli.js");
const { createAdr, normalizeStatus, slugify } = require("../bin/create-adr.js");
const { inferNorthstar, hasGateInput } = require("../bin/infer-northstar.js");
const { install } = require("../scripts/install.js");

function makeTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function read(dir, ...parts) {
  return fs.readFileSync(path.join(dir, ...parts), "utf8");
}

function runCli(args, cwd) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

test("slugify and normalizeStatus hard rules", () => {
  assert.equal(slugify("Auth vía Google!"), "auth-via-google");
  assert.equal(normalizeStatus("proposed"), "proposed");
  assert.equal(normalizeStatus("in-progress"), "in-progress");
  assert.throws(() => normalizeStatus("done"), /never writes to done/i);
  assert.throws(() => normalizeStatus("hecho"), /never writes to done/i);
});

test("create-adr bootstraps index, writes proposed ADR, updates index", () => {
  const dir = makeTemp("docskills-create-adr-");
  install({ lang: "es", dir, silent: true });

  const result = createAdr({
    title: "Auth vía Google",
    slug: "auth-google",
    dir,
    silent: true,
  });

  assert.equal(result.nnn, "001");
  assert.equal(result.status, "proposed");
  assert.ok(fs.existsSync(result.path));
  const body = fs.readFileSync(result.path, "utf8");
  assert.match(body, /# ADR 001: Auth vía Google/);
  assert.match(body, /## Contexto/);
  assert.match(body, /## Decisión/);
  assert.match(body, /## Consecuencias/);
  assert.match(body, /## Fases/);
  assert.match(body, /- \[ \] \*\*Fase 1\*\*/);
  assert.match(body, /## Criterio de salida/);
  assert.match(body, /## PROMPT PRÓXIMA SESIÓN/);
  assert.doesNotMatch(body, /-pendings-/i);

  const index = read(dir, "docs", "adr", "000-index.md");
  assert.match(index, /\[001\]\(proposed\/001-auth-google\.md\)/);

  const second = createAdr({
    title: "Segundo",
    dir,
    silent: true,
  });
  assert.equal(second.nnn, "002");
});

test("create-ADR alias via CLI and rejects done status", () => {
  const dir = makeTemp("docskills-create-alias-");
  install({ lang: "en", dir, silent: true });

  const ok = runCli(
    ["create-ADR", "--title", "Cache Redis", "--slug", "cache-redis", "--dir", dir],
    dir,
  );
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /docs\/adr\/proposed\/001-cache-redis\.md/);
  assert.match(ok.stdout, /adr-orchestrator/);

  const bad = runCli(
    ["create-adr", "--title", "Nope", "--status", "done", "--dir", dir],
    dir,
  );
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /never writes to done/i);
});

test("create-adr --from fills context sections", () => {
  const dir = makeTemp("docskills-create-from-");
  install({ lang: "en", dir, silent: true });
  const notes = path.join(dir, "notes.md");
  fs.writeFileSync(
    notes,
    "## Context\n\nObserved latency on Redis.\n\n## Decision\n\nUse a short TTL.\n",
    "utf8",
  );
  const result = createAdr({
    title: "Redis TTL",
    from: "notes.md",
    dir,
    silent: true,
  });
  const body = fs.readFileSync(result.path, "utf8");
  assert.match(body, /Observed latency on Redis/);
  assert.match(body, /Use a short TTL/);
});

test("infer-northstar gate blocks scan without goal/doc/paths", () => {
  assert.equal(hasGateInput({}), false);
  const dir = makeTemp("docskills-infer-gate-");
  install({ lang: "en", dir, silent: true });
  const blocked = runCli(["infer-northstar", "--dir", dir], dir);
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /WARNING|AVISO/i);
  assert.match(blocked.stderr, /requires a gate|requiere una puerta/i);
});

test("infer-northstar dry-run previews; --write persists inferred north-star", () => {
  const dir = makeTemp("docskills-infer-write-");
  install({ lang: "en", dir, silent: true });
  fs.writeFileSync(path.join(dir, "README.md"), "# Sample\n\nWe orchestrate ADRs.\n", "utf8");

  const preview = inferNorthstar({
    goal: "We ship a portable ADR kit for agents. Non-goal: product-specific skills.",
    dir,
    dryRun: true,
    silent: true,
  });
  assert.equal(preview.wrote, false);
  assert.match(preview.draft, /inferred/i);
  assert.match(preview.draft, /Zero back-compat blockers|clean cut/i);

  const written = inferNorthstar({
    goal: "We ship a portable ADR kit for agents. Non-goal: product-specific skills.",
    dir,
    write: true,
    silent: true,
  });
  assert.equal(written.wrote, true);
  const north = read(dir, "docs", "current", "north-star.md");
  assert.match(north, /inferred/i);
  assert.match(north, /portable ADR kit/);
  assert.match(north, /Living SSoT|live SSoT|docs\/current/i);
});

test("init installs north-star-template", () => {
  const dir = makeTemp("docskills-ns-template-");
  install({ lang: "es", dir, silent: true });
  assert.ok(fs.existsSync(path.join(dir, "templates", "north-star-template.md")));
  assert.match(read(dir, "templates", "north-star-template.md"), /Intención de producto|Product intent/);
});
