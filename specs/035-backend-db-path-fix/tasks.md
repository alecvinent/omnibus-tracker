# Tareas BL-035

## Phase 1: Diagnóstico y spec

- [x] T001 Confirmar en logs de FastAPI Cloud el `PermissionError` en `/data`.
- [x] T002 Crear `specs/035-backend-db-path-fix/spec.md` y `tasks.md`.

## Phase 2: Implementación

- [x] T003 Cambiar default de `API_KEYS_DB_PATH` en `backend/app/db.py` a ruta relativa dentro del proyecto.
- [x] T004 Ignorar directorio de datos SQLite en `.gitignore`.
- [x] T005 Actualizar `backend/README.md` con la nueva ruta default.

## Phase 3: Gates y cierre

- [x] T006 Verificar sintaxis de Python (`python -m py_compile backend/app/db.py`).
- [x] T007 Ejecutar `npm run typecheck` y `npm run lint` sin errores.
- [x] T008 Actualizar `docs/backlog.md` marcando BL-035 como `done` tras merge.
