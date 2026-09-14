---
name: adr-orchestrator
description: >-
  Orquesta la ingesta de ADRs, inspección de portafolio, ejecución por fases,
  validación, handoff y cierre. Usar al crear, numerar, inspeccionar, ejecutar,
  validar, hacer handoff o cerrar Architecture Decision Records.
---

# ADR orchestrator

Convierte decisiones de arquitectura **aprobadas** en un ADR vivo y ejecútalas con seguridad. Nunca crear ni modificar un ADR sin aprobación explícita del usuario.

**Hosts:** Claude Code, Cursor, Google Antigravity, VS Code Copilot. El skill es markdown + Node bajo `.agents/skills/adr-orchestrator/` (sin APIs de un IDE concreto). Si el entorno resuelve skills desde `.cursor/skills/` o `.claude/skills/`, usar la misma ruta relativa de scripts allí.

## Límites y SSoT

- Leer **primero** `docs/adr/000-index.md`. No abrir ADRs a ciegas.
- `docs/adr/proposed/` — aprobados, aún no en ejecución.
- `docs/adr/in-progress/` — ADR vivo (típicamente uno por sesión).
- `docs/adr/done/` — implementados. **No reescribir.** Enmendar con un ADR nuevo que cite al anterior.
- `docs/adr/deferred/` — postergados a propósito.
- `docs/current/` — producto vivo (SSoT). Conciso; sin historia de “antes hacíamos…”.
- `docs/archive/` — planes muertos. **Prohibido leer** salvo pedido explícito de “ideas viejas”.
- Nombres: `NNN-slug.md` (tres o más dígitos). Un archivo por trabajo; no companions `-pendings-…`.
- Invocar `doc-keeper` en closeout y antes de un commit.
- Los scripts auxiliares son de **solo lectura**: no mueven archivos, no reescriben ADRs, no hacen commit ni push.
- **North Star:** etapa de investigación y diseño. La retrocompatibilidad con esquemas, archivos o contratos viejos **nunca** es un blocker. Preferir corte limpio (ver `docs/current/north-star.md` y `.agents/rules/north-star-research-and-design.md`).
- Si una fase cambia contratos que consume otra superficie (UI, CLI, API satélite), actualizar esa superficie **en la misma fase**. No dejar el consumidor desfasado “para después”. Si no aplica, documentar `superficie: N/A (<motivo>)` en el handoff.

## Máquina de estados

```
ingesta aprobada → proposed/
     ↓ (al empezar a ejecutar)
in-progress/     ← un ADR vivo; fases [x] / [~] / [ ]
     ↓ (criterio de salida cumplido + doc-keeper)
done/            ← no reabrir; no reescribir
     ↘ (postergar a propósito)
deferred/
     ↘ (descartar)
docs/archive/
```

**Status en el archivo** (alineado a la carpeta):

| Status | Carpeta |
|--------|---------|
| `Proposed` / `Propuesto` | `proposed/` |
| `In progress` / `En curso` | `in-progress/` |
| `Done` / `Implemented` / `Hecho` | `done/` |
| `Deferred` / `Diferido` | `deferred/` |
| `Superseded` / `Supersedido` | carpeta actual + fila en el índice |

Fases: `[ ]` pendiente, `[~]` activa, `[x]` hecha. Marcar `[x]` solo tras verificación.

## Inspección compacta

Desde la raíz del repo:

```bash
node .agents/skills/adr-orchestrator/scripts/inspect-adrs.js
```

Si el skill está espejado:

```bash
node .cursor/skills/adr-orchestrator/scripts/inspect-adrs.js
node .claude/skills/adr-orchestrator/scripts/inspect-adrs.js
```

Incluir cerrados y diferidos:

```bash
node .agents/skills/adr-orchestrator/scripts/inspect-adrs.js --include-archive
```

Validar un ADR antes de ejecutar:

```bash
node .agents/skills/adr-orchestrator/scripts/validate-adr.js 019
```

Resolver primero problemas mecánicos del índice o de archivos (IDs duplicados, links rotos, vivos ausentes del índice). Luego el análisis semántico.

## Modos de trabajo

### INTAKE (Ingesta)

1. Separar evidencia observada, supuestos, decisiones, no-goals y preguntas abiertas.
2. Ejecutar `inspect-adrs.js` antes de asignar un número secuencial de 3 dígitos.
3. Identificar duplicaciones, traslapes, dependencias y falta de responsable.
4. Pedir **aprobación explícita** al usuario antes de escribir un archivo ADR o alterar el índice.
5. Crear `docs/adr/proposed/NNN-slug.md` (o `in-progress/` si se ejecuta de inmediato) y actualizar `docs/adr/000-index.md`.
6. Si el ADR tocará contratos visibles en otra superficie, mencionarlo en fases o consecuencias.

### PORTFOLIO (Gestión de cola)

1. Ejecutar `inspect-adrs.js`.
2. Resolver problemas mecánicos de índice o archivos antes del análisis semántico.
3. Leer únicamente los ADRs vivos implicados en la cola actual. No reescribir `done/`.
4. Recomendar fusionar, reemplazar (supersede), reordenar, vincular o crear trabajo nuevo.
5. Obtener aprobación del usuario antes de aplicar ediciones.

### EXECUTE (Ejecución de fases)

Para cada fase aprobada:

1. Ejecutar `validate-adr.js <ID>`; detenerse si falla la validación estructural.
2. Si el ADR está en `proposed/`, moverlo a `in-progress/` y poner Status `In progress` (con aprobación).
3. Evaluar deudas y gaps **antes** de codear. Si hace falta un contrato de una fase posterior, dejar un stub de firma y registrar la deuda; no fingir el feature.
4. Si se toca UI, preservar una copia `.bak` del archivo antes de reemplazar.
5. Implementar solo esa fase. Sin crecimiento de alcance.
6. Si hubo cambio de contrato consumido por otra superficie → actualizarla en la misma fase.
7. Correr la suite de pruebas del repositorio (el comando que el proyecto ya usa). Cero regresiones.
8. Marcar `[x]` solo tras verificación; `[~]` si sigue activa; `[ ]` si pendiente.
9. Actualizar `PROMPT PRÓXIMA SESIÓN` al finalizar (ver HANDOFF).

Detenerse ante pruebas fallidas, decisiones arquitectónicas no aprobadas, trabajo destructivo, alcance excesivo o conflictos de Git fuera de la política aprobada.

### HANDOFF (Traspaso de sesión)

Al pausar o al terminar una fase sin cerrar el ADR:

1. Dejar el ADR en `in-progress/` (no moverlo a `done/`).
2. Actualizar **PROMPT PRÓXIMA SESIÓN**: qué está `[x]`, qué quedó `[~]`, siguiente paso, deudas, comando de validación, superficies tocadas o `N/A`.
3. Actualizar `docs/adr/000-index.md` si cambió de carpeta o de orden.
4. No archivar el ADR. Invocar `doc-keeper` solo si hay SSoT viva que ya cambió.

### CLOSEOUT (Cierre)

1. Validar el ADR (`validate-adr.js`) y asegurar la suite de pruebas en verde.
2. Clasificar cada brecha restante como resuelto, absorbido, diferido, rechazado u abierto con responsable.
3. Confirmar que las superficies consumidoras reflejan el backend/código vivo, o dejar deuda explícita con responsable si el usuario posterga el sync.
4. Invocar `doc-keeper`:
   - Mover de `in-progress/` (o `proposed/`) a `docs/adr/done/`.
   - Cambiar Status a `Done` / `Implemented` / `Hecho`.
   - Actualizar `docs/adr/000-index.md`.
   - Actualizar SSoT en `docs/current/`.
   - Archivar borradores y planes sueltos en `docs/archive/`.
5. Re-ejecutar `inspect-adrs.js` para confirmar consistencia.
6. Commit o push **solo** cuando el usuario lo autorice de forma explícita.

## Estructura viva del ADR

Usar [templates/adr-template.md](../../../templates/adr-template.md). Esqueleto mínimo:

```markdown
# ADR NNN: Título

- **Status**: Proposed (`proposed/`)
- **Date**: YYYY-MM-DD
- **Order**: N — después de ADR XXX

## Objetivo

## No-goals

## Decisión

## Fases
- [ ] Fase 1 — Entregable y verificación

## Criterio de salida

## PROMPT PRÓXIMA SESIÓN
```

## Recursos

- [examples.md](examples.md) — flujos de ingesta, fase, handoff y cierre.
- [checklists.md](checklists.md) — listas operativas por modo.
- Índice bootstrap: [templates/adr-index-template.md](../../../templates/adr-index-template.md).
