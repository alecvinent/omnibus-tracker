# Tasks: Historial de rutas frecuentes

**Input**: `specs/025-trip-history/spec.md`

**Branch**: `feature/025-trip-history`

## Phase 1: Modelo y persistencia

- [x] T001 Agregar `TripHistoryItem` en `src/domain/models.ts`.
- [x] T002 Crear tabla `trip_history` en `src/db/database.ts` con índice por `created_at`.
- [ ] T003 Implementar `saveTripHistoryItem`, `listTripHistory`, `deleteTripHistoryItem` y `clearTripHistory` en `src/db/repositories.ts`.

## Phase 2: Guardar búsquedas

- [ ] T004 Integrar guardado en `app/index.tsx` al presionar "Buscar ómnibus" (solo origen explícito).
- [ ] T005 Actualizar `docs/backlog.md` con criterios de privacidad claros.

## Phase 3: Pantalla de historial

- [ ] T006 Crear `app/history.tsx` para listar rutas recientes.
- [ ] T007 Agregar botones de borrar ítem individual y "Borrar todo".
- [ ] T008 Agregar acceso a historial desde la barra inferior de `app/index.tsx`.

## Phase 4: Gates y documentación

- [ ] T009 Ejecutar `npm run typecheck` y `npm run lint` sin errores.
- [ ] T010 Actualizar `specs/025-trip-history/spec.md` si cambia el alcance.
- [ ] T011 Hacer commit convencional y mergear a `develop`.

## Dependencies & Execution Order

- T001/T002/T003 son dependencias bloqueantes.
- T004 y T006 pueden desarrollarse en paralelo una vez T003 esté listo.
- T007 depende de T006.
- T009/T010/T011 son gates finales.
