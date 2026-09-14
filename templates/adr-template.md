# ADR NNN: Título corto

- **Status**: Proposed (`proposed/`)
- **Date**: YYYY-MM-DD
- **Order**: NNN — después de ADR XXX (o “primero”)

## Objetivo

Qué problema se resuelve y para quién. Una o dos frases.

## No-goals

Qué queda **fuera** de este ADR (explícito).

## Contexto

Evidencia observada, no supuestos. Separar hechos de hipótesis.

## Decisión

La decisión y las alternativas descartadas. Preferir corte limpio sobre compatibilidad zombi (North Star).

## Fases

- [ ] **Fase 1** — Entregable + cómo se verifica
- [ ] **Fase 2** — Entregable + cómo se verifica

Usar `[~]` en la fase activa y `[x]` solo tras verificación.

## Criterio de salida

Condiciones observables (pruebas del repo, contratos, docs). Sin esto no hay closeout.

## Consecuencias

Efectos en código, datos, otras superficies consumidoras y operación. Si no hay superficie satélite: `N/A (<motivo>)`.

## PROMPT PRÓXIMA SESIÓN

1. Estado: carpeta actual y checkboxes.
2. Siguiente paso concreto (fase N).
3. Comando: `node .agents/skills/adr-orchestrator/scripts/validate-adr.js NNN`
4. Deudas abiertas / stubs.
