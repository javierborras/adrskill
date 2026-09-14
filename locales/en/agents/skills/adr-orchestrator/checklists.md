# Checklists — adr-orchestrator

Copy the active-mode block and tick it in the session.

## Intake

```
- [ ] Evidence / assumptions / decisions / no-goals / questions, separated
- [ ] inspect-adrs.js run; next ID free
- [ ] Duplicates, overlaps, and dependencies reviewed
- [ ] Explicit user approval
- [ ] NNN-slug.md created (proposed/ or in-progress/)
- [ ] 000-index.md updated
```

## Portfolio

```
- [ ] inspect-adrs.js
- [ ] Mechanical issues (IDs, links, live ADRs off-index) resolved or reported
- [ ] Only live ADRs read
- [ ] done/ not rewritten
- [ ] Recommendation (merge / supersede / reorder / defer)
- [ ] Approval before editing
```

## Execute

```
- [ ] validate-adr.js <ID> valid
- [ ] ADR in in-progress/; Status aligned
- [ ] Debts/gaps assessed; stubs if needed
- [ ] UI .bak if UI is touched
- [ ] Only the approved phase
- [ ] Consuming surfaces up to date or N/A documented
- [ ] Repo test suite green
- [ ] Checkbox [x] / [~] / [ ] consistent
- [ ] NEXT SESSION PROMPT updated
```

## Handoff

```
- [ ] Still in in-progress/
- [ ] Concrete next-session prompt (phase, debt, command)
- [ ] Index consistent
- [ ] No commit unless explicitly requested
```

## Closeout

```
- [ ] validate-adr.js ok
- [ ] Tests green
- [ ] Leftovers classified (resolved / deferred / rejected / open+owner)
- [ ] doc-keeper invoked
- [ ] Moved to done/; Status Done/Implemented/Hecho
- [ ] 000-index.md and docs/current/ updated
- [ ] Loose plans in docs/archive/
- [ ] inspect-adrs.js clean
- [ ] Commit only with explicit authorization
```
