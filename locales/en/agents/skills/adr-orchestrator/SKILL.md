---
name: adr-orchestrator
description: >-
  Orchestrates ADR intake, portfolio inspection, phase execution,
  validation, handoff, and closeout. Use when creating, numbering, inspecting,
  executing, validating, handing off, or closing Architecture Decision Records.
---

# ADR orchestrator

Turn **approved** architecture decisions into a live ADR and execute them safely. Never create or modify an ADR without explicit user approval.

**Hosts:** Claude Code, Cursor, Google Antigravity, VS Code Copilot. The skill is markdown + Node under `.agents/skills/adr-orchestrator/` (no IDE-specific APIs). If the environment resolves skills from `.cursor/skills/` or `.claude/skills/`, use the same relative script path there.

## Limits and SSoT

- Read `docs/adr/000-index.md` **first**. Do not open ADRs blindly.
- `docs/adr/proposed/` — approved, not yet in execution.
- `docs/adr/in-progress/` — live ADR (typically one per session).
- `docs/adr/done/` — implemented. **Do not rewrite.** Amend with a new ADR that cites the previous one.
- `docs/adr/deferred/` — postponed on purpose.
- `docs/current/` — live product (SSoT). Concise; no “we used to…” history.
- `docs/archive/` — dead plans. **Do not read** unless explicitly asked for “old ideas”.
- Names: `NNN-slug.md` (three or more digits). One file per piece of work; no `-pendings-…` companions.
- Invoke `doc-keeper` on closeout and before a commit.
- Helper scripts are **read-only**: they do not move files, rewrite ADRs, commit, or push.
- **North Star:** research and design stage. Backwards compatibility with old schemas, files, or contracts is **never** a blocker. Prefer a clean cut (see `docs/current/north-star.md` and `.agents/rules/north-star-research-and-design.md`).
- If a phase changes contracts consumed by another surface (UI, CLI, satellite API), update that surface **in the same phase**. Do not leave the consumer stale “for later”. If it does not apply, document `surface: N/A (<reason>)` in the handoff.

## State machine

```
approved intake → proposed/
     ↓ (when execution starts)
in-progress/     ← one live ADR; phases [x] / [~] / [ ]
     ↓ (exit criteria met + doc-keeper)
done/            ← do not reopen; do not rewrite
     ↘ (postpone on purpose)
deferred/
     ↘ (discard)
docs/archive/
```

**Status in the file** (aligned with the folder):

| Status | Folder |
|--------|--------|
| `Proposed` / `Propuesto` | `proposed/` |
| `In progress` / `En curso` | `in-progress/` |
| `Done` / `Implemented` / `Hecho` | `done/` |
| `Deferred` / `Diferido` | `deferred/` |
| `Superseded` / `Supersedido` | current folder + a row in the index |

Phases: `[ ]` pending, `[~]` active, `[x]` done. Mark `[x]` only after verification.

## Compact inspection

From the repo root:

```bash
node .agents/skills/adr-orchestrator/scripts/inspect-adrs.js
```

If the skill is mirrored:

```bash
node .cursor/skills/adr-orchestrator/scripts/inspect-adrs.js
node .claude/skills/adr-orchestrator/scripts/inspect-adrs.js
```

Include closed and deferred:

```bash
node .agents/skills/adr-orchestrator/scripts/inspect-adrs.js --include-archive
```

Validate an ADR before executing:

```bash
node .agents/skills/adr-orchestrator/scripts/validate-adr.js 019
```

Fix mechanical index or file problems first (duplicate IDs, broken links, live ADRs missing from the index). Then do semantic analysis.

## Work modes

### INTAKE

1. Separate observed evidence, assumptions, decisions, no-goals, and open questions.
2. Run `inspect-adrs.js` before assigning a sequential 3-digit number.
3. Identify duplicates, overlaps, dependencies, and missing owners.
4. Ask the user for **explicit approval** before writing an ADR file or changing the index.
5. Create `docs/adr/proposed/NNN-slug.md` (or `in-progress/` if it will execute immediately) and update `docs/adr/000-index.md`.
6. If the ADR will touch contracts visible on another surface, mention it in phases or consequences.

### PORTFOLIO (queue management)

1. Run `inspect-adrs.js`.
2. Resolve mechanical index or file issues before semantic analysis.
3. Read only the live ADRs involved in the current queue. Do not rewrite `done/`.
4. Recommend merge, replace (supersede), reorder, link, or new work.
5. Get user approval before applying edits.

### EXECUTE (phase execution)

For each approved phase:

1. Run `validate-adr.js <ID>`; stop if structural validation fails.
2. If the ADR is in `proposed/`, move it to `in-progress/` and set Status `In progress` (with approval).
3. Assess debts and gaps **before** coding. If a later phase's contract is needed, leave a signature stub and record the debt; do not fake the feature.
4. If UI is touched, keep a `.bak` copy of the file before replacing it.
5. Implement only that phase. No scope growth.
6. If a contract consumed by another surface changed → update that surface in the same phase.
7. Run the repository test suite (the command the project already uses). Zero regressions.
8. Mark `[x]` only after verification; `[~]` if still active; `[ ]` if pending.
9. Update `NEXT SESSION PROMPT` when finishing (see HANDOFF).

Stop on failing tests, unapproved architecture decisions, destructive work, excessive scope, or Git conflicts outside the approved policy.

### HANDOFF (session transfer)

When pausing or finishing a phase without closing the ADR:

1. Leave the ADR in `in-progress/` (do not move it to `done/`).
2. Update **NEXT SESSION PROMPT**: what is `[x]`, what stayed `[~]`, next step, debts, validation command, surfaces touched or `N/A`.
3. Update `docs/adr/000-index.md` if the folder or order changed.
4. Do not archive the ADR. Invoke `doc-keeper` only if live SSoT already changed.

### CLOSEOUT

1. Validate the ADR (`validate-adr.js`) and confirm the test suite is green.
2. Classify each remaining gap as resolved, absorbed, deferred, rejected, or open with an owner.
3. Confirm consuming surfaces reflect the live backend/code, or leave explicit debt with an owner if the user postpones the sync.
4. Invoke `doc-keeper`:
   - Move from `in-progress/` (or `proposed/`) to `docs/adr/done/`.
   - Change Status to `Done` / `Implemented` / `Hecho`.
   - Update `docs/adr/000-index.md`.
   - Update SSoT in `docs/current/`.
   - Archive loose drafts and plans in `docs/archive/`.
5. Re-run `inspect-adrs.js` to confirm consistency.
6. Commit or push **only** when the user authorizes it explicitly.

## Live ADR structure

Use [templates/adr-template.md](../../../templates/adr-template.md). Minimum skeleton:

```markdown
# ADR NNN: Title

- **Status**: Proposed (`proposed/`)
- **Date**: YYYY-MM-DD
- **Order**: N — after ADR XXX

## Objective

## No-goals

## Decision

## Phases
- [ ] Phase 1 — Deliverable and verification

## Exit criteria

## NEXT SESSION PROMPT
```

## Resources

- [examples.md](examples.md) — intake, phase, handoff, and closeout flows.
- [checklists.md](checklists.md) — operational lists per mode.
- Bootstrap index: [templates/adr-index-template.md](../../../templates/adr-index-template.md).
