# Ejemplos de adr-orchestrator

Orientativos. Nunca autorizan cambios en ADRs o Git sin confirmación del usuario.

## Intake (ingesta)

1. Ejecutar `inspect-adrs.js`.
2. Separar evidencia observada de la propuesta técnica.
3. Identificar dependencias y no-goals explícitos.
4. Presentar alcance y pedir aprobación.
5. Tras aprobación, crear `docs/adr/proposed/023-nuevo-feature.md` y actualizar `docs/adr/000-index.md`.

## Ejecución de una fase

1. Ejecutar `validate-adr.js 019`.
2. Si el ADR está en `proposed/`, moverlo a `in-progress/` (aprobación previa).
3. Marcar la fase con `[~]`.
4. Evaluar deudas; stubs de contrato si hace falta una interfaz de una fase posterior.
5. Implementar solo el código de esa fase.
6. Si cambió un contrato que consume otra superficie, actualizarla en la misma fase.
7. Correr la suite de pruebas del repo.
8. Marcar `[x]` cuando pase la verificación; actualizar `PROMPT PRÓXIMA SESIÓN`.

## Handoff (fin de sesión sin cierre)

1. Dejar el archivo en `in-progress/`.
2. Escribir el prompt de próxima sesión: fase activa, deudas, comando `validate-adr.js <ID>`, superficies N/A o pendientes.
3. No mover a `done/`. No reescribir ADRs cerrados.

## Closeout

1. `validate-adr.js` ok y pruebas en verde.
2. Invocar `doc-keeper`.
3. Mover `docs/adr/in-progress/019-*.md` → `docs/adr/done/019-*.md`.
4. Actualizar `docs/adr/000-index.md` (sección `done/`).
5. Actualizar `docs/current/`.
6. Re-ejecutar `inspect-adrs.js` antes del commit autorizado.
