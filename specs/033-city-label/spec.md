: Mostrar ciudad y país en selector de preferencias

**Feature Branch**: `033-city-label`

**Created**: 2026-11-21

**Status**: Done

**Input**: Backlog BL-033: el selector de ciudad debe mostrar nombre y país de la ciudad configurada.

## User Scenarios & Testing

### User Story 1 - Ver ciudad actual en preferencias (Priority: P0)

El usuario abre la pantalla de preferencias y ve claramente qué ciudad está seleccionada, con nombre y país.

**Acceptance Scenarios**:

1. **Given** que el usuario abre Preferencias, **When** mira la fila "Ciudad", **Then** ve el nombre y país de la ciudad seleccionada (ej. "Montevideo, Uruguay").
2. **Given** que el usuario abre el selector de ciudad, **When** se listan las opciones, **Then** cada opción muestra nombre y país.

## Requirements

### Functional Requirements

- **FR-001**: `src/config/cities.ts` DEBE definir una etiqueta `label` con nombre y país para cada ciudad.
- **FR-002**: La fila de ciudad en `app/preferences.tsx` DEBE mostrar `selectedCity.label`.
- **FR-003**: El modal selector de ciudad DEBE mostrar `city.label` para cada opción.

## Success Criteria

- **SC-001**: El selector y la fila de preferencias muestran ciudad y país.
- **SC-002**: `npm run typecheck` y `npm run lint` pasan limpios.

## Assumptions

- Solo hay una ciudad soportada en el MVP; la estructura debe escalar a múltiples ciudades.
