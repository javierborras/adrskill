# North Star: Etapa de Investigación y Diseño (Sin Bloqueos por Retrocompatibilidad)

> Regla canónica para análisis, ADRs y refactors. Copia o adapta este criterio a `docs/current/north-star.md` del repositorio destino (SSoT viva).

1. **Etapa activa de diseño:** El repositorio se encuentra en etapa de investigación, diseño y validación de arquitectura.
2. **Cero bloqueos por retrocompatibilidad:** En análisis técnicos, diseño de ADRs y refactors, mantener retrocompatibilidad con esquemas viejos, archivos heredados, tablas obsoletas o contratos anteriores **nunca debe ser un blocker**.
3. **Corte limpio preferido:** Si un refactor arquitectónico (desacople, simplificación, reducción de costos, eliminación de SPOF) rompe compatibilidad con estructuras previas, se adopta el corte limpio. No acumular código zombi ni fallbacks defensivos innecesarios.
4. **SSoT viva:** El código y la política actuales mandan. Documentar migraciones en el ADR o el handoff; no atar el diseño futuro a layouts o contratos muertos.
5. **Checklist rápido:**
   - ¿Mejora desacople, claridad o costo operativo? Avanzar.
   - ¿La retrocompatibilidad agrega complejidad, ambigüedad o código extra? Descartarla y cortar limpio.
   - ¿Hay migración de datos o de configuración? Documentarla de forma explícita y ejecutar el cambio.
