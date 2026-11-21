---

description: "Task list for route stops feature"

---

# Tasks: Mostrar paradas de la ruta seleccionada en el mapa

**Input**: `specs/024-route-stops/spec.md`

**Branch**: `feature/024-route-stops`

## Phase 1: Modelos y contrato

- [x] T001 Extender `TripMapViewProps` para aceptar un `itinerary?: PlannedItinerary`.
- [x] T002 Verificar que `TransitStop` tenga coordenadas obligatorias.

## Phase 2: Selección en resultados

- [x] T003 Agregar estado `selectedItinerary` en `app/results.tsx`.
- [x] T004 Resaltar visualmente el itinerario seleccionado en `ItineraryCard`.
- [x] T005 Pasar el itinerario seleccionado a `MapView`.

## Phase 3: Mapa

- [x] T006 Actualizar `MapView.native.tsx` para renderizar marcadores de paradas del itinerario.
- [x] T007 Distinguir visualmente subida, bajada e intermedias.
- [x] T008 Ajustar cámara para incluir todas las paradas relevantes.

## Phase 4: Documentación y gates

- [x] T009 Actualizar `docs/backlog.md`: marcar BL-024 según corresponda.
- [x] T010 Ejecutar `npm run typecheck` y `npm run lint` sin errores.
- [x] T011 Hacer commit convencional y mergear a `develop`.

## Dependencies & Execution Order

- T001/T002 son bloqueantes.
- T003/T004/T005 dependen de T001.
- T006/T007/T008 dependen de T005.
- T009/T010/T011 son gates finales.
