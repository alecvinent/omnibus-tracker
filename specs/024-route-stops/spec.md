# Feature Specification: Mostrar paradas de la ruta seleccionada en el mapa

**Feature Branch**: `024-route-stops`

**Created**: 2026-11-20

**Status**: Done

**Input**: User description: "Mostrar paradas de la ruta seleccionada en el mapa"

## User Scenarios & Testing

### User Story 1 - Seleccionar un itinerario (Priority: P1)

En la pantalla de resultados, el usuario puede tocar un itinerario para seleccionarlo como opción activa.

**Why this priority**: Sin selección no hay forma de saber qué ruta se está dibujando en el mapa.

**Independent Test**: Tocar una tarjeta de itinerario y ver que resalta visualmente.

**Acceptance Scenarios**:

1. **Given** una lista de itinerarios, **When** el usuario toca uno, **Then** queda marcado como seleccionado.
2. **Given** que no hay itinerarios, **Then** no se muestra selector.

---

### User Story 2 - Dibujar paradas del itinerario en el mapa (Priority: P1)

Al seleccionar un itinerario, el mapa muestra marcadores para la parada de subida, la parada de bajada y las paradas intermedias de cada leg.

**Why this priority**: Permite al usuario ubicar visualmente dónde subir/bajar del ómnibus.

**Independent Test**: Seleccionar un itinerario con legs y ver marcadores de paradas sobre MapLibre.

**Acceptance Scenarios**:

1. **Given** un itinerario seleccionado con paradas, **When** se renderiza el mapa, **Then** se muestran marcadores para cada parada.
2. **Given** que se cambia de itinerario, **When** se selecciona otro, **Then** los marcadores se actualizan.
3. **Given** que no hay itinerarios seleccionados, **Then** solo se muestran origen y destino.

---

### User Story 3 - Distinguir tipos de parada (Priority: P2)

Los marcadores diferencian la primera parada (subida), la última (bajada) y las intermedias.

**Why this priority**: Mejora la legibilidad de la ruta.

**Independent Test**: Verificar colores/formas diferentes para subida, bajada e intermedias.

**Acceptance Scenarios**:

1. **Given** un itinerario con transbordo, **When** se muestran las paradas, **Then** se distingue visualmente cada tipo.

---

### Edge Cases

- Itinerario sin legs: no se muestran paradas adicionales.
- Paradas sin coordenadas: se omiten sin crashear.
- Cambio rápido de selección: el mapa no entra en estado inconsistente.

## Requirements

### Functional Requirements

- **FR-001**: La pantalla de resultados DEBE permitir seleccionar un itinerario.
- **FR-002**: El mapa DEBE recibir el itinerario seleccionado.
- **FR-003**: El mapa DEBE mostrar marcadores para cada parada de cada leg del itinerario.
- **FR-004**: El mapa DEBE distinguir visualmente parada de subida, bajada e intermedias.
- **FR-005**: Si no hay itinerario seleccionado, el mapa DEBE mostrar solo origen y destino.
- **FR-006**: NO DEBEN inventarse paradas ni geometrías si el servicio no tiene datos.

### Key Entities

- **PlannedItinerary**: contiene legs.
- **TransitLeg**: contiene `from` y `to` (TransitStop).
- **TransitStop**: id, name, coordinate.

## Success Criteria

- **SC-001**: Al seleccionar un itinerario, sus paradas aparecen en el mapa en menos de 500 ms.
- **SC-002**: Los marcadores no se superponen de forma ilegible.
- **SC-003**: `npm run typecheck` y `npm run lint` pasan limpios.

## Assumptions

- Las coordenadas de paradas vienen del backend (OTP/GTFS). Hasta entonces no se verán paradas reales.
- El componente mapa nativo ya usa MapLibre y acepta `origin`/`destination`.
