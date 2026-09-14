# ADR NNN: Short title

- **Status**: Proposed (`proposed/`)
- **Date**: YYYY-MM-DD
- **Order**: NNN — after ADR XXX (or “first”)

## Objective

What problem this solves and for whom. One or two sentences.

## No-goals

What is **out of scope** for this ADR (explicit).

## Context

Observed evidence, not assumptions. Separate facts from hypotheses.

## Decision

The decision and the discarded alternatives. Prefer a clean cut over zombie compatibility (North Star).

## Phases

- [ ] **Phase 1** — Deliverable + how it is verified
- [ ] **Phase 2** — Deliverable + how it is verified

Use `[~]` on the active phase and `[x]` only after verification.

## Exit criteria

Observable conditions (repo tests, contracts, docs). Without these there is no closeout.

## Consequences

Effects on code, data, other consuming surfaces, and operations. If there is no satellite surface: `N/A (<reason>)`.

## NEXT SESSION PROMPT

1. Status: current folder and checkboxes.
2. Concrete next step (phase N).
3. Command: `node .agents/skills/adr-orchestrator/scripts/validate-adr.js NNN`
4. Open debts / stubs.
