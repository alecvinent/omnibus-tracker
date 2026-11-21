# Tasks: Proteger endpoints de la API con API key

**Input**: `specs/030-api-key-auth/spec.md`

**Branch**: `feature/030-api-key-auth`

## Phase 1: Backend - persistencia y auth

- [x] T001 Crear `backend/app/auth.py` con funciones de hash, verificación y dependencias FastAPI.
- [x] T002 Crear `backend/app/db.py` con inicialización de SQLite y tabla `api_keys`.
- [x] T003 Implementar operaciones CRUD/rotación/revocación de API keys.

## Phase 2: Backend - endpoints

- [x] T004 Agregar dependencia de API key a `/v1/geocode/search` y `/v1/trips/plan`.
- [x] T005 Crear endpoints admin bajo `/admin/api-keys` protegidos por `ADMIN_API_KEY`.
- [x] T006 Actualizar `backend/README.md` con instrucciones de uso.

## Phase 3: Frontend móvil

- [x] T007 Agregar `API_KEY` en `src/config/env.ts` desde `EXPO_PUBLIC_API_KEY`.
- [x] T008 Enviar header `X-API-Key` en `src/services/geocoding.ts` y `src/services/planner.ts`.
- [x] T009 Actualizar `.env.dev`, `.env.example` y `eas.json` con placeholders.

## Phase 4: Documentación y gates

- [x] T010 Actualizar `docs/backlog.md`: marcar BL-030 como done.
- [x] T011 Ejecutar `npm run typecheck` y `npm run lint` sin errores.
- [x] T012 Verificar sintaxis del backend (`python -m compileall backend/app`).
- [x] T013 Crear `docs/security.md` explicando el mecanismo.
- [x] T014 Hacer commit convencional y mergear a `develop`.

## Dependencies & Execution Order

- T001/T002/T003 son bloqueantes.
- T004/T005 dependen de T001/T002/T003.
- T006 puede trabajarse en paralelo a T004/T005.
- T007/T008/T009 dependen de T004.
- T010/T011/T012/T013/T014 son gates finales.
