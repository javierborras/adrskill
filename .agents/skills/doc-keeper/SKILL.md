---
name: doc-keeper
description: >-
  Mantiene la documentación SSoT, registra ADRs y archiva planes viejos antes
  de cada commit. Usar antes de git commit, al cerrar un hito o cuando lo
  invoca adr-orchestrator en closeout.
---

# doc-keeper

Evita polución de contexto: los agentes no deben leer borradores viejos como si fueran la Fuente de la Verdad.

1. **`docs/current/`**: estado presente (SSoT). Conciso. Sin “antes hacíamos…”.
2. **`docs/adr/`**: *por qué* cambió algo. Subcarpetas: `proposed/`, `in-progress/`, `done/`, `deferred/` (ver `000-index.md`). Descartados → `docs/archive/`.
3. **`docs/archive/`**: planes muertos. **Prohibido leerlos** al programar salvo pedido explícito de “ideas viejas”.

Leer `docs/adr/000-index.md` antes de abrir ADRs. **No reescribir** `docs/adr/done/`.

**North Star:** etapa de investigación y diseño. No bloquear actualizaciones de docs por retrocompatibilidad de esquemas viejos. Preferir corte limpio (`.agents/rules/north-star-research-and-design.md`).

## Cuándo

Justo antes de `git commit`, al terminar un hito, o cuando `adr-orchestrator` llega a CLOSEOUT.

## Pasos

### 1. Análisis

Qué cambió en código, contratos, configuración o comportamiento observable. No inventar historia.

### 2. SSoT

Actualizar `docs/current/` (producto, API, config, alcance, north-star si cambió el criterio). Modificar, no inflar.

### 3. ADR

Si hubo decisión estructural:

- Nacimiento: archivo secuencial `NNN-slug.md` en `proposed/` (o `in-progress/` si ya se ejecuta). Pedir aprobación si el archivo aún no existe — no crear ADRs por cuenta propia.
- Cierre: mover a `done/`; Status `Done` / `Implemented` / `Hecho`.
- Postergar: mover a `deferred/`.
- Descartar: `docs/archive/` con timestamp, no dejar el archivo en el índice como vigente.
- Actualizar `docs/adr/000-index.md`. Fila en **Supersedidos** si uno gana sobre otro.

Estructura viva: Objetivo, No-goals, Decisión, Fases (`[x]` / `[~]` / `[ ]`), Criterio de salida, **PROMPT PRÓXIMA SESIÓN**. Un archivo por trabajo — no companions `-pendings-…`. Plantilla: `templates/adr-template.md` del kit (o la copia en el repo destino).

Los ADRs en `done/` conservan título y texto originales (historia). Enmendar con un ADR nuevo que cite al cerrado.

### 4. Archivo

Planes sueltos (`implementation_plan*.md`, notas de fase, dumps) → `docs/archive/` con timestamp (`YYYYMMDD_HHMM-…`). No copiar secretos.

### 5. Confirmación

Antes de dar OK de closeout: verificar que exista `docs/current/north-star.md`. Si falta, no inventar en silencio — pedir goal/doc/paths y correr `docskills infer-northstar` (puerta obligatoria; default dry-run; `--write` solo con aprobación), o redactarlo a mano desde `templates/north-star-template.md`.

Resumen: docs tocados, ADR creado/movido, qué se archivó, north-star presente. OK para commit **solo** si el usuario lo autorizó.

## Límites

- No leer `docs/archive/` para “ponerse al día”.
- No reescribir `done/`.
- No inventar ADRs ni alterar el índice sin aprobación.
- No commit ni push desde este skill.
