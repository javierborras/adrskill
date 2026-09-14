# Instrucciones para VS Code Copilot

Leer y seguir [AGENTS.md](../AGENTS.md) en la raíz del repositorio. Ese archivo es la convención canónica de contexto (Cursor, Antigravity, Claude Code y Copilot).

## Antes de tocar ADRs o docs

1. Leer `docs/adr/000-index.md`.
2. Tratar `docs/current/` como SSoT viva.
3. No reescribir archivos en `docs/adr/done/`.
4. No leer `docs/archive/` salvo pedido explícito del usuario.

## Skills (leer el `SKILL.md` antes de actuar)

- `.agents/skills/adr-orchestrator/SKILL.md` — ingesta, inspección de portafolio, ejecución por fases, validación, handoff y cierre de ADRs.
- `.agents/skills/doc-keeper/SKILL.md` — actualizar SSoT, registrar ADRs y archivar planes muertos **antes** de un commit o al cerrar un hito.

Si el proyecto espeja skills hacia `.cursor/skills/` o `.claude/skills/`, el contenido es el mismo: usar esas copias o los originales bajo `.agents/skills/`.

## North Star

El proyecto está en etapa de investigación y diseño. No bloquear refactors por retrocompatibilidad. Preferir corte limpio sobre código zombi. Ver `.agents/rules/north-star-research-and-design.md` y `docs/current/north-star.md`.

## Git

No crear commits ni hacer push salvo autorización explícita del usuario.
