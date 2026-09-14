---
name: doc-keeper
description: >-
  Keeps SSoT documentation current, registers ADRs, and archives stale plans
  before each commit. Use before git commit, when closing a milestone, or when
  adr-orchestrator invokes it on closeout.
---

# doc-keeper

Prevent context pollution: agents must not read old drafts as if they were the Source of Truth.

1. **`docs/current/`**: present state (SSoT). Concise. No “we used to…”.
2. **`docs/adr/`**: *why* something changed. Subfolders: `proposed/`, `in-progress/`, `done/`, `deferred/` (see `000-index.md`). Discarded → `docs/archive/`.
3. **`docs/archive/`**: dead plans. **Do not read them** while coding unless explicitly asked for “old ideas”.

Read `docs/adr/000-index.md` before opening ADRs. **Do not rewrite** `docs/adr/done/`.

**North Star:** research and design stage. Do not block docs updates for backwards compatibility with old schemas. Prefer a clean cut (`.agents/rules/north-star-research-and-design.md`).

## When

Just before `git commit`, when finishing a milestone, or when `adr-orchestrator` reaches CLOSEOUT.

## Steps

### 1. Analysis

What changed in code, contracts, configuration, or observable behavior. Do not invent history.

### 2. SSoT

Update `docs/current/` (product, API, config, scope, north-star if the criterion changed). Edit, do not inflate.

### 3. ADR

If there was a structural decision:

- Birth: sequential file `NNN-slug.md` in `proposed/` (or `in-progress/` if it already executes). Ask for approval if the file does not exist yet — do not create ADRs on your own.
- Closeout: move to `done/`; Status `Done` / `Implemented` / `Hecho`.
- Postpone: move to `deferred/`.
- Discard: `docs/archive/` with a timestamp; do not leave the file in the index as current.
- Update `docs/adr/000-index.md`. Row under **Superseded** if one wins over another.

Live structure: Objective, No-goals, Decision, Phases (`[x]` / `[~]` / `[ ]`), Exit criteria, **NEXT SESSION PROMPT**. One file per piece of work — no `-pendings-…` companions. Template: the kit's `templates/adr-template.md` (or the copy in the destination repo).

ADRs in `done/` keep their original title and text (history). Amend with a new ADR that cites the closed one.

### 4. Archive

Loose plans (`implementation_plan*.md`, phase notes, dumps) → `docs/archive/` with a timestamp (`YYYYMMDD_HHMM-…`). Do not copy secrets.

### 5. Confirmation

Summary: docs touched, ADR created/moved, what was archived. OK to commit **only** if the user authorized it.

## Limits

- Do not read `docs/archive/` to “catch up”.
- Do not rewrite `done/`.
- Do not invent ADRs or change the index without approval.
- No commit or push from this skill.
