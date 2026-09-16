# adr-orchestrator examples

Guidance only. They never authorize ADR or Git changes without user confirmation.

## Intake

1. (Optional) `node <kit>/bin/cli.js create-adr --title "…" --slug …`
2. Run `inspect-adrs.js`.
3. Separate observed evidence from the technical proposal.
4. Identify dependencies and explicit no-goals.
5. Present scope and ask for approval.
6. After approval, create `docs/adr/proposed/023-new-feature.md` and update `docs/adr/000-index.md` (or use `create-adr`).

## Phase execution

1. Run `validate-adr.js 019`.
2. If the ADR is in `proposed/`, move it to `in-progress/` (prior approval).
3. Mark the phase with `[~]`.
4. Assess debts; contract stubs if a later-phase interface is needed.
5. Implement only that phase's code.
6. If a contract consumed by another surface changed, update that surface in the same phase.
7. Run the repo test suite.
8. Mark `[x]` when verification passes; update `NEXT SESSION PROMPT`.

## Handoff (end of session without closeout)

1. Leave the file in `in-progress/`.
2. Write the next-session prompt: active phase, debts, `validate-adr.js <ID>` command, surfaces N/A or pending.
3. Do not move to `done/`. Do not rewrite closed ADRs.

## Closeout

1. `validate-adr.js` ok and tests green.
2. Invoke `doc-keeper`.
3. Move `docs/adr/in-progress/019-*.md` → `docs/adr/done/019-*.md`.
4. Update `docs/adr/000-index.md` (`done/` section).
5. Update `docs/current/`.
6. Re-run `inspect-adrs.js` before the authorized commit.
