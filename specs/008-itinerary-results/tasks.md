# Tasks: Mostrar itinerarios en resultados

**Input**: `specs/008-itinerary-results/spec.md`

**Branch**: `feature/008-itinerary-results`

## Phase 1: Contrato y servicio

- [x] T001 Verificar que `src/services/planner.ts` envíe `UserPreferences` en el request.
- [x] T002 Agregar manejo de errores de red en `src/services/planner.ts`.

## Phase 2: UI de resultados

- [x] T003 Crear `src/components/ItineraryCard.tsx` para mostrar duración, caminata, transbordos y piernas.
- [x] T004 Actualizar `app/results.tsx` para consultar el planificador al montarse.
- [x] T005 Mostrar estados de carga, error, vacío y lista de itinerarios.
- [x] T006 Leer preferencias del usuario desde SQLite y pasarlas al planificador.

## Phase 3: Documentación y gates

- [x] T007 Actualizar `docs/backlog.md`: marcar BL-008 in-progress/done según corresponda.
- [x] T008 Ejecutar `npm run typecheck` y `npm run lint` sin errores.
- [x] T009 Hacer commit convencional y mergear a `develop`.

## Dependencies & Execution Order

- T001/T002 son bloqueantes para T004.
- T003 y T004 pueden trabajarse en paralelo.
- T006 depende de T004.
- T007/T008/T009 son gates finales.
