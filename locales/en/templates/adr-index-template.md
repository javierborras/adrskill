# ADR index

Decision map. **Open the subfolder that matches the status.**

```
docs/adr/
├── proposed/      ← approved, not yet in execution
├── in-progress/   ← live ADR (typically one)
├── done/          ← already implemented (do not reopen, do not rewrite)
└── deferred/      ← later on purpose
```

Discarded → [`docs/archive/`](../archive/).

**Sessions:** one live ADR in `in-progress/` (phases `[x]` / `[~]` / `[ ]` + PROMPT). No `-pendings-…` companions. On closeout → `done/`.

**Status:** no note = current. Not current: [Superseded](#superseded). Live product: `docs/current/`. Do not rewrite `done/`.

---

## in-progress/

| ADR | Title |
|-----|-------|
| <!-- [NNN](in-progress/NNN-slug.md) | Title --> |

---

## proposed/ — backlog

| ADR | Title |
|-----|-------|
| <!-- [NNN](proposed/NNN-slug.md) | Title --> |

---

## deferred/ — postponed

| ADR | Title |
|-----|-------|
| <!-- [NNN](deferred/NNN-slug.md) | Title --> |

---

## done/

Titles and text of these ADRs are **historical**. They are not rewritten. Amend with a new ADR.

| ADR | Title |
|-----|-------|
| <!-- [NNN](done/NNN-slug.md) | Title --> |

---

## Superseded

Who wins today. The rest of the index is current. Do not rewrite `done/`.

| ADR | Status |
|-----|--------|
| <!-- [NNN](deferred/NNN-slug.md) | replaced by [MMM](done/MMM-slug.md) --> |
