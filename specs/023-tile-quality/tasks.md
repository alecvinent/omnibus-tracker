---

description: "Task list for tile quality feature"

---

# Tasks: Mejorar calidad visual de los tiles del mapa

**Input**: `specs/023-tile-quality/spec.md`

**Branch**: `feature/023-tile-quality`

## Phase 1: Investigación y decisión

- [ ] T001 Validar que los estilos candidatos devuelvan JSON MapLibre GL válido.
- [ ] T002 Comparar proveedores en `docs/deployment.md`.
- [ ] T003 Elegir proveedor principal y justificar.

## Phase 2: Configuración

- [ ] T004 Actualizar `.env.dev`, `.env` y `eas.json` con `EXPO_PUBLIC_MAP_STYLE_URL` del proveedor elegido.
- [ ] T005 Actualizar fallback en `src/config/env.ts` para no depender de demotiles.
- [ ] T006 Actualizar `.env.example` con ambas opciones comentadas.

## Phase 3: Documentación y gates

- [ ] T007 Actualizar `docs/backlog.md`: marcar BL-009 y BL-023 según corresponda.
- [ ] T008 Ejecutar `npm run typecheck` y `npm run lint` sin errores.
- [ ] T009 Hacer commit convencional y mergear a `develop`.

## Dependencies & Execution Order

- T001/T002/T003 son bloqueantes.
- T004/T005/T006 dependen de T003.
- T007/T008/T009 son gates finales.
