# Feature Specification: Mostrar itinerarios en resultados

**Feature Branch**: `008-itinerary-results`

**Created**: 2026-11-20

**Status**: In Progress

**Input**: User description: "Mostrar itinerarios, paradas y transbordos en resultados"

## User Scenarios & Testing

### User Story 1 - Ver alternativas de viaje (Priority: P1)

Después de buscar origen y destino, el usuario ve una lista de itinerarios ordenados por duración y cantidad de transbordos, con tiempo de caminata total y ETA.

**Why this priority**: Es el resultado principal de la app: mostrar opciones reales de viaje en transporte público.

**Independent Test**: Entrar a `/results` con parámetros de origen/destino y verificar que se muestra la sección de itinerarios (vacía, cargando o con datos).

**Acceptance Scenarios**:

1. **Given** que el backend devuelve itinerarios, **When** se cargan los resultados, **Then** se muestra una lista con duración, caminata y transbordos.
2. **Given** que el backend no está configurado, **When** se cargan los resultados, **Then** se muestra un estado de error/información sin datos inventados.
3. **Given** que la consulta está en curso, **When** el usuario espera, **Then** se muestra un indicador de carga.

---

### User Story 2 - Ver detalle de piernas (Priority: P1)

Cada itinerario muestra sus piernas (legs): línea de ómnibus, parada de subida y parada de bajada, con horarios cuando estén disponibles.

**Why this priority**: Permite al usuario entender exactamente qué tomar y dónde subir/bajar.

**Independent Test**: Expandir/ver un itinerario y comprobar que se listan las piernas con routeShortName, from.name y to.name.

**Acceptance Scenarios**:

1. **Given** un itinerario con varias piernas, **When** se renderiza, **Then** se muestra cada leg con línea y paradas.
2. **Given** un itinerario sin piernas (solo caminata), **When** se renderiza, **Then** se indica que no hay tramos en ómnibus.

---

### User Story 3 - Aplicar preferencias del usuario (Priority: P2)

El resultado respeta las preferencias guardadas (evitar transbordos, caminar menos, accesibilidad) enviándolas al backend.

**Why this priority**: Personaliza las alternativas según el perfil del usuario.

**Independent Test**: Cambiar preferencias y verificar que se envían en el body de la petición a `/v1/trips/plan`.

**Acceptance Scenarios**:

1. **Given** preferencias guardadas, **When** se planifica el viaje, **Then** el request incluye `avoidTransfers`, `minimizeWalking` y `accessibleOnly`.
2. **Given** que no hay preferencias, **When** se planifica, **Then** se usan valores por defecto.

---

### Edge Cases

- Backend caído o sin configurar: mostrar error sin inventar datos.
- Origen/destino inválidos: mostrar mensaje claro.
- Lista vacía de itinerarios: mostrar estado vacío.
- Sin conexión: mostrar error de red.

## Requirements

### Functional Requirements

- **FR-001**: La pantalla de resultados DEBE consultar `/v1/trips/plan` al montarse.
- **FR-002**: La consulta DEBE incluir origen, destino y preferencias del usuario.
- **FR-003**: La UI DEBE mostrar estados de carga, error, vacío y éxito.
- **FR-004**: Cada itinerario DEBE mostrar duración, distancia de caminata y cantidad de transbordos.
- **FR-005**: Cada itinerario DEBE listar sus piernas con línea, parada de origen y parada de destino.
- **FR-006**: NO DEBEN generarse datos ficticios cuando el servicio no esté configurado.

### Key Entities

- **PlannedItinerary**: id, durationMinutes, walkingDistanceMeters, transfers, legs.
- **TransitLeg**: routeId, routeShortName, from, to, departureTime, arrivalTime.
- **TransitStop**: id, name, coordinate.

## Success Criteria

- **SC-001**: Los resultados se cargan en menos de 3 segundos en red normal.
- **SC-002**: El estado de error se muestra sin datos inventados.
- **SC-003**: Todos los itinerarios recibidos se renderizan correctamente.
- **SC-004**: `npm run typecheck` y `npm run lint` pasan limpios.

## Assumptions

- El backend `/v1/trips/plan` ya existe y responde con `PlannedItinerary[]` o 503 si no está conectado.
- Las preferencias se leen desde SQLite (`UserPreferences`).
- Los shapes/geometrías de cada leg se dibujarán en BL-017, no en esta historia.
