# North Star (template)

> Copy or adapt into `docs/current/north-star.md`. Mark inferred drafts clearly until reviewed.

## Product intent

2–5 sentences: who it is for, what problem it solves, what “done” looks like for the product.

## Non-goals

- What this project deliberately does **not** optimize for.
- Do not preserve dead schemas / contracts as design blockers.

## Principles

1. **Research and design stage** — live criterion wins over inherited layouts.
2. **Zero back-compat blockers** — prefer a clean cut over zombie compatibility.
3. **Living SSoT** — `docs/current/` describes the present; history lives in ADRs or `docs/archive/`.
4. **One ADR per decision** — `docs/adr/` with `proposed/`, `in-progress/`, `done/`, `deferred/`.

## Evidence (optional)

- List the paths or docs used when this file was inferred or authored.

## Quick checklist

- Does it improve decoupling, clarity, or cost? Proceed.
- Does backwards compatibility add complexity? Drop it and cut clean.
- Is there a migration? Document it in the ADR and execute the change.
