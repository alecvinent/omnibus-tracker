## Workflow

Este proyecto corre sobre el **flujo spec-kit (specify)**, gobernado por
`.specify/memory/constitution.md`. Léelo antes de actuar.

Todo el trabajo sigue un único pipeline, en orden. Cada ítem nace como una
entrada `BL-xxx` en `docs/backlog.md` (la única fuente de specs):

`backlog → /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.analyze → /speckit.implement → /speckit.converge`

- No saltear una etapa ni su gate de revisión.
- Tras `/speckit.tasks`, ejecutar `/speckit.analyze`, resolver todos los
  hallazgos y re-ejecutar hasta quedar limpio. Solo entonces
  `/speckit.implement`.
- Cerrar con `/speckit.converge` para anexar el trabajo no construido como
  tareas.
- Una feature no está completa hasta que los README afectados y la
  documentación (`README.md`, `docs/`) reflejen el comportamiento entregado.
- Arrastrar los ids `BL-xxx` por specs, planes, tareas y mensajes de commit.

## Delivery

- `develop` es la rama de integración. Toda feature entra por una rama
  `feature/NNN-<slug>` cortada desde `develop`; los PRs apuntan a `develop`.
  Nunca commitear directamente a `main`.
- `main` es la rama de release protegida: refleja el último release
  etiquetado. Los releases se cortan fusionando `develop → main` (o
  etiquetando).
- Gates antes del merge: `npm run typecheck`, `npm run lint` (cero
  errores), tests del frontend y del backend, y la checklist de Review
  Gates de la constitución.
- Todas las invocaciones a git van por `rtk` (ver sección rtk abajo).

## Skills

Las skills de agentes y procesos (superpowers, speckit, etc.) son
**subordinadas a este workflow** aquí. Pueden informar cómo se hace una
etapa; nunca anulan el orden de etapas, los gates ni la autoridad del
backlog.

## Key files

- `docs/backlog.md` — fuente de verdad de specs (`BL-xxx`).
- `.specify/memory/constitution.md` — principios gobernantes.
- `README.md` — overview del producto y guía de desarrollo.
- `docs/architecture.md` — capas y flujo de planificación.
- `docs/data-sources.md` — fuentes oficiales (IMM, GTFS, OSM).
- `backend/README.md` — hoja de ruta del backend.

## Conventions

- **Specs:** una épica → un directorio de feature `specs/NNN-<slug>/` (el
  siguiente número se asigna secuencialmente); una historia (`BL-xxx`) → un
  grupo de tareas en `tasks.md`.
- **Estado del backlog:** `todo` · `in-progress` · `done`. Marcar
  `in-progress` cuando arranca la rama, `done` solo tras el merge del PR en
  `develop` y la actualización de docs/readme. Secuenciar según el corte MVP
  (`docs/backlog.md`).
- **Ramas:** cortar `feature/NNN-<slug>` desde `develop`; PRs hacia
  `develop`. Nunca commitear a `main`.
- **Gates:** tests en verde y lint/typecheck limpios antes del merge.

## rtk - git

Usar `rtk` para todas las llamadas a git. Nunca usar `git` directamente.

Ejemplos: `rtk git status`, `rtk git diff`, `rtk git log --oneline -10`,
`rtk git add <files>`, `rtk git commit -m "..."`, `rtk git push`.

`rtk` es un proxy optimizado que recorta hasta 90% del output y ahorra
tokens (ver `C:\Users\Dell\.claude\RTK.md`).
