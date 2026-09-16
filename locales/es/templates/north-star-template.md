# North Star (plantilla)

> Copiá o adaptá a `docs/current/north-star.md`. Marcá claramente los borradores inferidos hasta revisarlos.

## Intención de producto

2–5 oraciones: para quién es, qué problema resuelve, cómo se ve el “listo” del producto.

## No-goals

- Qué este proyecto **no** optimiza a propósito.
- No preservar esquemas / contratos muertos como blockers de diseño.

## Principios

1. **Etapa de investigación y diseño** — el criterio vivo gana sobre layouts heredados.
2. **Cero bloqueos por retrocompatibilidad** — preferir corte limpio sobre compatibilidad zombi.
3. **SSoT viva** — `docs/current/` describe el presente; la historia vive en ADRs o `docs/archive/`.
4. **Un ADR por decisión** — `docs/adr/` con `proposed/`, `in-progress/`, `done/`, `deferred/`.

## Evidencia (opcional)

- Listá las rutas o docs usados cuando se inferió o escribió este archivo.

## Checklist rápido

- ¿Mejora desacople, claridad o costo? Avanzar.
- ¿La retrocompatibilidad agrega complejidad? Descartarla y cortar limpio.
- ¿Hay migración? Documentarla en el ADR y ejecutar el cambio.
