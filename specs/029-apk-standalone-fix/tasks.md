# Tasks: Fix APK standalone local en blanco

**Input**: `specs/029-apk-standalone-fix/spec.md`

**Branch**: `feature/029-apk-standalone-fix`

## Phase 1: Hacer el build local standalone

- [x] T001 Cambiar `scripts/android-local-build.ps1` para que use `assembleRelease` y embeba el bundle JS.
- [x] T002 Setear `NODE_ENV=production` en el entorno del build local.
- [x] T003 Actualizar `package.json` si es necesario para reflejar que `android:apk` genera release.

## Phase 2: Corregir errores de runtime y tipos

- [x] T004 Hacer idempotente la migración de SQLite en `src/db/database.ts`.
- [x] T005 Corregir el error de tipo en `src/components/MapView.native.tsx` al llamar `fitBounds`.

## Phase 3: Documentación y gates

- [x] T006 Actualizar `TESTEAR_APP.md` para indicar que la APK ahora es standalone y no requiere Metro.
- [x] T007 Ejecutar `npm run typecheck` y `npm run lint` sin errores.
- [x] T008 Actualizar `docs/backlog.md` marcando BL-029 como `done` tras el merge.

## Dependencies & Execution Order

- T001/T002/T003 son independientes entre sí pero bloquean la verificación de SC-001.
- T004 y T005 son independientes entre sí.
- T007 es gate final para cualquier cambio de código.
