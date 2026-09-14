# Instructions for VS Code Copilot

Read and follow [AGENTS.md](../AGENTS.md) at the repository root. That file is the canonical context convention (Cursor, Antigravity, Claude Code, and Copilot).

## Before touching ADRs or docs

1. Read `docs/adr/000-index.md`.
2. Treat `docs/current/` as the live SSoT.
3. Do not rewrite files in `docs/adr/done/`.
4. Do not read `docs/archive/` unless the user asks explicitly.

## Skills (read `SKILL.md` before acting)

- `.agents/skills/adr-orchestrator/SKILL.md` — intake, portfolio inspection, phase execution, validation, handoff, and closeout of ADRs.
- `.agents/skills/doc-keeper/SKILL.md` — update SSoT, register ADRs, and archive dead plans **before** a commit or when closing a milestone.

If the project mirrors skills to `.cursor/skills/` or `.claude/skills/`, the content is the same: use those copies or the originals under `.agents/skills/`.

## North Star

This project is in a research and design stage. Do not block refactors for backwards compatibility. Prefer a clean cut over zombie code. See `.agents/rules/north-star-research-and-design.md` and `docs/current/north-star.md`.

## Git

Do not create commits or push unless the user authorizes it explicitly.
