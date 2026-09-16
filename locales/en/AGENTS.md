# AGENTS.md

Context conventions for agents in this repository.

Cursor and Google Antigravity read this file natively. Claude Code imports it from `CLAUDE.md`. VS Code Copilot consumes it via `.github/copilot-instructions.md`.

## Do not read unless explicitly asked

Do not read, cite, use as context, or explore by default:

- `docs/archive/` — dead plans; not SSoT.

Enter that folder only when the user asks explicitly (for example, “old ideas”).

Before opening ADRs: read `docs/adr/000-index.md`; the live product lives in `docs/current/`; do not rewrite `docs/adr/done/`.

## North Star: Research and Design (No Back-Compat Blockers)

This project is in an active research and design stage. Any refactor needed to decouple, simplify, or improve the architecture **must not be blocked by preserving backwards compatibility** with old schemas, files, or contracts. Prefer a clean cut over accumulating zombie code.

See [docs/current/north-star.md](docs/current/north-star.md) (live SSoT of the destination repo) and [.agents/rules/north-star-research-and-design.md](.agents/rules/north-star-research-and-design.md).

## Canonical documentation

| Path | Role |
|------|------|
| `docs/current/` | Present state (live SSoT). Concise. No “we used to…”. |
| `docs/adr/000-index.md` | Queue index and lifecycle. Read it **before** opening ADRs. |
| `docs/adr/proposed/` | Approved decisions, not yet in execution. |
| `docs/adr/in-progress/` | Live ADR being executed (typically one). |
| `docs/adr/done/` | Implemented. **Do not rewrite.** |
| `docs/adr/deferred/` | Postponed on purpose. |
| `docs/archive/` | Dead and discarded plans. Do not read unless explicitly asked. |

File names: `NNN-slug.md` (three or more digits). One file per piece of work; no `-pendings-…` companions.

## Skills in this kit

- `adr-orchestrator` — intake (step 0: `create-adr`), portfolio, phase execution, validation, handoff, and closeout.
- `doc-keeper` — update SSoT, ensure `docs/current/north-star.md`, register ADRs, and archive stale plans **before** a commit or when closing a milestone.

Kit CLI (from the clone or `npx`):

```powershell
node <kit>\bin\cli.js create-adr --title "Auth Google" --slug auth-google
node <kit>\bin\cli.js infer-northstar --goal "…" --dry-run
```

`infer-northstar` requires a gate (`--goal` / `--doc` / `--paths`) before scanning; default dry-run; `--write` only with approval. Marks the draft as inferred.

Invoke `doc-keeper` on every closeout and before `git commit`.
