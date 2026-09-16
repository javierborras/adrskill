<!-- docskills:start -->
# AGENTS.md

Convenciones de contexto para agentes en este repositorio.

Cursor y Google Antigravity leen este archivo de forma nativa. Claude Code lo importa desde `CLAUDE.md`. VS Code Copilot lo consume vía `.github/copilot-instructions.md`.

## No leer salvo pedido explícito

No leer, no citar, no usar como contexto y no explorar por default:

- `docs/archive/` — planes muertos; no son SSoT.

Solo entrar a esa carpeta si el usuario lo pide de forma explícita (por ejemplo, “ideas viejas”).

Antes de abrir ADRs: leer `docs/adr/000-index.md`; el producto vivo está en `docs/current/`; no reescribir `docs/adr/done/`.

## North Star: Investigación y Diseño (Sin Bloqueos por Retrocompatibilidad)

El proyecto está en etapa activa de investigación y diseño. Cualquier refactor necesario para desacoplar, simplificar o mejorar la arquitectura **no debe bloquearse por mantener retrocompatibilidad** con esquemas, archivos o contratos antiguos. Preferir el corte limpio sobre la acumulación de código zombi.

Ver [docs/current/north-star.md](docs/current/north-star.md) (SSoT viva del repo destino) y [.agents/rules/north-star-research-and-design.md](.agents/rules/north-star-research-and-design.md).

## Conducta

Socio técnico: ni asistente complaciente ni abogado del diablo. Problema primero, sin elogios.
No reabras lo ya decidido (código/ADRs done). Cuestioná solo arquitectura/datos materiales o choque con North Star.
Trade-offs solo si importan — pros/contras breves, nada trivial.
No afirmes símbolos/APIs/configs sin verlos en el repo; si no, "no verificado".
No digas que test/build pasó si no lo corriste acá. No inventes errores ni traces.
Librería nueva no pedida ni usada → preguntá. "No sé" > guess seguro.

## Documentación canónica

| Ruta | Rol |
|------|-----|
| `docs/current/` | Estado presente (SSoT viva). Conciso. Sin “antes hacíamos…”. |
| `docs/adr/000-index.md` | Índice de cola y ciclo de vida. Leerlo **antes** de abrir ADRs. |
| `docs/adr/proposed/` | Decisiones aprobadas, aún no en ejecución. |
| `docs/adr/in-progress/` | ADR vivo en ejecución (típicamente uno). |
| `docs/adr/done/` | Implementado. **No reescribir.** |
| `docs/adr/deferred/` | Postergado a propósito. |
| `docs/archive/` | Planes muertos y descartados. No leer salvo pedido explícito. |

Nombres de archivo: `NNN-slug.md` (tres o más dígitos). Un archivo por trabajo; no companions `-pendings-…`.

## Skills de este kit

- `adr-orchestrator` — ingesta (paso 0: `create-adr`), portafolio, ejecución por fases, validación, handoff y cierre.
- `doc-keeper` — actualizar SSoT, asegurar `docs/current/north-star.md`, registrar ADRs y archivar planes viejos **antes** de un commit o al cerrar un hito.

CLI del kit (desde el clone o `npx`):

```powershell
node <kit>\bin\cli.js create-adr --title "Auth Google" --slug auth-google
node <kit>\bin\cli.js infer-northstar --goal "…" --dry-run
```

`infer-northstar` exige puerta (`--goal` / `--doc` / `--paths`) antes de escanear; default dry-run; `--write` solo con aprobación. Marca el borrador como inferido.

Invocar `doc-keeper` en cada closeout y antes de `git commit`.
<!-- docskills:end -->
