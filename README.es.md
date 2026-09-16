# adrskill (docskills)

Kit portable para Architecture Decision Records (ingesta, cola, ejecución por fases, validación, handoff y cierre) y para mantener la SSoT viva **antes** de cada commit.

Compatible con **Cursor**, **Claude Code**, **Google Antigravity** y **VS Code Copilot**.

Repo: [https://github.com/javierborras/adrskill](https://github.com/javierborras/adrskill)

Las rutas canónicas siguen en inglés (`docs/adr/…`). Las instrucciones para el agente son inglés o español, según el flag de instalación.

La landing de GitHub (con la misma instalación) está en el [README](README.md).

## Instalar desde GitHub

Clonar el pack (queda instalable en la raíz del clone, no anidado):

```powershell
gh repo clone javierborras/adrskill
```

Equivalente:

```powershell
git clone https://github.com/javierborras/adrskill.git
```

HTTPS: [https://github.com/javierborras/adrskill](https://github.com/javierborras/adrskill)

## Fusionar en otro repo

Desde la raíz del **proyecto destino** (Cursor, Claude Code, Antigravity o VS Code Copilot):

```powershell
gh repo clone javierborras/adrskill
node .\adrskill\bin\cli.js init --lang es
```

Inglés:

```powershell
node .\adrskill\bin\cli.js init --lang en
```

Si el clone ya está en otro path:

```powershell
node <ruta-al-clone>\bin\cli.js init --lang es
node <ruta-al-clone>\bin\cli.js init --lang en
```

Lo mismo con npx:

```powershell
npx --yes .\adrskill init --lang es
npx --yes .\adrskill init --lang en
```

Flags: `--lang`, `--locale` o `-l` con `en` o `es`. `--dir <ruta>` instala en otro directorio.

Si se omite `--lang` y hay TTY, el instalador pregunta. Sin TTY, el default es `en`.

Re-ejecutar es seguro: actualiza archivos del kit, no borra ADRs existentes y no pisa a ciegas un `AGENTS.md` de proyecto (agrega o refresca una sección delimitada).

Qué queda en el proyecto destino:

| Host | Qué usa |
|------|---------|
| **Cursor** | `.cursor/skills` + `.cursor/rules/docskills.mdc` |
| **Claude Code** | `.claude/skills` + `CLAUDE.md` |
| **Google Antigravity** | `AGENTS.md` + `.agents/skills` |
| **VS Code Copilot** | `.github/copilot-instructions.md` |

## Qué instala

| Pieza | Función |
|-------|---------|
| `.agents/skills/adr-orchestrator/` | Ciclo de vida de ADRs + scripts Node de solo lectura |
| `.agents/skills/doc-keeper/` | SSoT, índice ADR y archivo de planes muertos |
| `.cursor/skills/` y `.claude/skills/` | Junctions (Windows), symlinks (Unix) o copia |
| `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` | Instrucciones del host en el idioma elegido |
| `.cursor/rules/docskills.mdc` | Regla always-on de Cursor |
| `.agents/rules/north-star-research-and-design.md` | North Star de corte limpio |
| `templates/` | Plantillas de ADR, índice y north-star en el idioma elegido |
| `docs/current`, `docs/adr/…`, `docs/archive` | Bootstrap si faltan |
| `.claude-plugin/`, `.codex-plugin/`, `.github/plugin/` | Adaptadores para que otros hosts funcionen después |

## Cómo disparar los skills

| Skill | Cuándo |
|-------|--------|
| `adr-orchestrator` | Crear, numerar, inspeccionar, ejecutar fases, validar, handoff o cerrar un ADR. Paso 0 de ingesta: `create-adr`. |
| `doc-keeper` | Antes de `git commit`, al cerrar un hito, o al final de CLOSEOUT (verifica que exista north-star). |

Frases útiles: “usá adr-orchestrator”, “create-adr”, “infer-northstar”, “ingestá este ADR”, “inspeccioná el portafolio”, “ejecutá la fase 2 del 019”, “handoff”, “cerrá el ADR”, “doc-keeper antes del commit”.

### CLI: create-adr e infer-northstar

Desde el clone del kit (o con `npx`):

```powershell
node .\adrskill\bin\cli.js create-adr --title "Auth vía Google" --slug auth-google
node .\adrskill\bin\cli.js create-ADR --title "Cache Redis" --status in-progress --from notes.md
node .\adrskill\bin\cli.js infer-northstar --goal "Construimos X para Y. No-goal Z." --dry-run
node .\adrskill\bin\cli.js infer-northstar --doc docs\current\scope.md --write
```

- `create-adr` (alias `create-ADR`): siguiente `NNN`, escribe `docs/adr/<status>/NNN-slug.md`, actualiza el índice. Default `proposed`. **Nunca** `done/`. Sin companions `-pendings-`.
- `infer-northstar`: **puerta obligatoria** (`--goal` / `--doc` / `--paths`) antes de escanear. Default dry-run; solo escribe con `--write`. Marca el borrador como inferido. Heurísticas (no dump ciego): README*, `docs/current/`, `package.json`, `*.sln`, `Cargo.toml`, entrypoints.

Scripts (solo lectura), desde la raíz del repo destino:

```powershell
node .agents/skills/adr-orchestrator/scripts/inspect-adrs.js
node .agents/skills/adr-orchestrator/scripts/inspect-adrs.js --include-archive
node .agents/skills/adr-orchestrator/scripts/validate-adr.js 019
```

## Fallback manual

Si no se puede correr Node, copiar `locales/es/` o `locales/en/` al proyecto con las mismas rutas de destino que el instalador (skills bajo `.agents/skills/`, más `AGENTS.md` y los adaptadores) y copiar `.agents/skills/*/scripts/` desde este kit. Preferir el comando de `init` de arriba.

## Layout en el repo destino

```
docs/
  current/          ← SSoT viva (producto, API, north-star)
  adr/
    000-index.md    ← leer ANTES de abrir ADRs
    proposed/       ← aprobado, aún no en ejecución
    in-progress/    ← ADR vivo (típicamente uno)
    done/           ← implementado; NO reescribir
    deferred/       ← postergado a propósito
  archive/          ← planes muertos; no leer salvo pedido explícito
```

Nombres de ADR: `NNN-slug.md` (tres o más dígitos). Un archivo por trabajo; no companions `-pendings-…`.

## Máquina de estados

`proposed/` → `in-progress/` → `done/`. Atajos: `deferred/` (postergar), `docs/archive/` (descartar). Fases `[ ]` / `[~]` / `[x]`. Nunca reescribir `done/`. Leer el índice primero. North Star: corte limpio, sin bloqueo por retrocompatibilidad.

## Requisitos

- Node.js 18+ para `init`, `create-adr`, `infer-northstar` y los scripts de ADR (CommonJS, sin dependencias extra).
- Git según las reglas del repo destino. Este kit **no** hace commit ni push en el proyecto destino.

## Fuera de alcance

Este pack no incluye skills de producto (sync de proveedores, fuentes legales, stacks concretos, runners de test de un lenguaje). La ejecución de fases usa **la suite de pruebas del repo destino**, no un comando fijo.

Este repo del kit también se puede cambiar de idioma: `node bin/cli.js init --lang es` o `--lang en`.
