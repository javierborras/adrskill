# Índice ADR

Mapa de decisiones. **Abrí la subcarpeta según el estado.**

```
docs/adr/
├── proposed/      ← aprobado, aún no en ejecución
├── in-progress/   ← ADR vivo (típicamente uno)
├── done/          ← ya implementado (no reabrir, no reescribir)
└── deferred/      ← más adelante a propósito
```

Descartados → [`docs/archive/`](../archive/).

**Sesiones:** un ADR vivo en `in-progress/` (fases `[x]` / `[~]` / `[ ]` + PROMPT). Sin companions `-pendings-…`. Al cerrar → `done/`.

**Estado:** sin nota = vigente. No vigentes: [Supersedidos](#supersedidos). Producto vivo: `docs/current/`. No reescribir `done/`.

---

## in-progress/

| ADR | Título |
|-----|--------|
| <!-- [NNN](in-progress/NNN-slug.md) | Título --> |

---

## proposed/ — backlog

| ADR | Título |
|-----|--------|
| <!-- [NNN](proposed/NNN-slug.md) | Título --> |

---

## deferred/ — postergados

| ADR | Título |
|-----|--------|
| <!-- [NNN](deferred/NNN-slug.md) | Título --> |

---

## done/

Títulos y texto de estos ADRs son **históricos**. No se reescriben. Enmendar con un ADR nuevo.

| ADR | Título |
|-----|--------|
| <!-- [NNN](done/NNN-slug.md) | Título --> |

---

## Supersedidos

Quién gana hoy. El resto del índice es vigente. No reescribir `done/`.

| ADR | Estado |
|-----|--------|
| <!-- [NNN](deferred/NNN-slug.md) | sustituido por [MMM](done/MMM-slug.md) --> |
