# Checklists — adr-orchestrator

Copiar el bloque del modo activo y marcarlo en la sesión.

## Intake

```
- [ ] Evidencia / supuestos / decisiones / no-goals / preguntas, separados
- [ ] inspect-adrs.js ejecutado; siguiente ID libre
- [ ] Duplicados, traslapes y dependencias revisados
- [ ] Aprobación explícita del usuario
- [ ] Archivo NNN-slug.md creado (proposed/ o in-progress/)
- [ ] 000-index.md actualizado
```

## Portfolio

```
- [ ] inspect-adrs.js
- [ ] Issues mecánicos (IDs, links, vivos fuera del índice) resueltos o reportados
- [ ] Solo ADRs vivos leídos
- [ ] done/ no reescrito
- [ ] Recomendación (merge / supersede / reordenar / diferir)
- [ ] Aprobación antes de editar
```

## Execute

```
- [ ] validate-adr.js <ID> válido
- [ ] ADR en in-progress/; Status alineado
- [ ] Deudas/gaps evaluados; stubs si aplica
- [ ] .bak de UI si se toca UI
- [ ] Solo la fase aprobada
- [ ] Superficies consumidoras al día o N/A documentado
- [ ] Suite de pruebas del repo en verde
- [ ] Checkbox [x] / [~] / [ ] coherente
- [ ] PROMPT PRÓXIMA SESIÓN actualizado
```

## Handoff

```
- [ ] Sigue en in-progress/
- [ ] Prompt de próxima sesión concreto (fase, deuda, comando)
- [ ] Índice coherente
- [ ] Sin commit salvo pedido explícito
```

## Closeout

```
- [ ] validate-adr.js ok
- [ ] Pruebas en verde
- [ ] Pendientes clasificados (resuelto / diferido / rechazado / abierto+responsable)
- [ ] doc-keeper invocado
- [ ] Movido a done/; Status Done/Implemented/Hecho
- [ ] 000-index.md y docs/current/ actualizados
- [ ] Planes sueltos en docs/archive/
- [ ] inspect-adrs.js limpio
- [ ] Commit solo con autorización explícita
```
