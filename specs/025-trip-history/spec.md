# Feature Specification: Historial de rutas frecuentes

**Feature Branch**: `025-trip-history`

**Created**: 2026-11-20

**Status**: Done

**Input**: User description: "Guardar historial de rutas del usuario. Son las rutas frecuentes del usuario."

## User Scenarios & Testing

### User Story 1 - Guardar búsqueda exitosa (Priority: P1)

Cuando el usuario realiza una búsqueda de viaje con origen y destino explícitos, la app guarda la ruta en una tabla local de SQLite para poder reutilizarla después.

**Why this priority**: Es la base de toda la funcionalidad de historial; sin persistencia no hay "frecuentes" ni "recientes".

**Independent Test**: Realizar una búsqueda con origen manual/destino manual y verificar que `trip_history` tenga una fila con los datos correctos.

**Acceptance Scenarios**:

1. **Given** que el usuario ingresó origen y destino explícitos, **When** presiona "Buscar ómnibus", **Then** se guarda un registro en SQLite con origen, destino, coordenadas y timestamp.
2. **Given** que el origen es la ubicación GPS actual ("Mi ubicación"), **When** presiona "Buscar ómnibus", **Then** no se guarda la ruta para respetar la privacidad.

---

### User Story 2 - Ver historial reciente (Priority: P1)

El usuario puede abrir una pantalla de historial y ver sus últimas rutas buscadas, ordenadas de más reciente a más antigua.

**Why this priority**: Permite reutilizar rutas frecuentes sin volver a escribir origen/destino.

**Independent Test**: Navegar a "Historial" después de guardar al menos una búsqueda y ver que aparece en la lista.

**Acceptance Scenarios**:

1. **Given** que hay rutas guardadas, **When** el usuario entra a la pantalla de historial, **Then** ve una lista ordenada por fecha descendente.
2. **Given** que no hay rutas guardadas, **When** el usuario entra a la pantalla de historial, **Then** ve un mensaje vacío.

---

### User Story 3 - Borrar historial (Priority: P2)

El usuario puede borrar una ruta individual o limpiar todo el historial.

**Why this priority**: Control de privacidad y utilidad básica de gestión de datos locales.

**Independent Test**: Presionar borrar en un ítem y luego presionar "Borrar todo"; verificar que SQLite quede vacío.

**Acceptance Scenarios**:

1. **Given** una lista de rutas guardadas, **When** el usuario presiona borrar en una, **Then** esa ruta desaparece y las demás permanecen.
2. **Given** una lista de rutas guardadas, **When** el usuario presiona "Borrar todo", **Then** la lista queda vacía.

---

### Edge Cases

- ¿Qué pasa si la base de datos no está inicializada? Se inicializa al arrancar la app (`initializeDatabase`).
- ¿Qué pasa si el origen es GPS? No se persiste (privacidad).
- ¿Qué pasa si hay muchas rutas? Se puede agregar un límite configurable; por ahora se listan las últimas 50.

## Requirements

### Functional Requirements

- **FR-001**: El sistema DEBE persistir cada búsqueda exitosa con origen explícito en SQLite (`trip_history`).
- **FR-002**: El sistema NO DEBE persistir búsquedas cuyo origen sea la ubicación GPS actual.
- **FR-003**: El usuario DEBE poder ver una lista de rutas recientes ordenadas por `created_at` descendente.
- **FR-004**: El usuario DEBE poder borrar una ruta individual.
- **FR-005**: El usuario DEBE poder borrar todo el historial.

### Key Entities

- **TripHistoryItem**: representa una ruta buscada. Atributos: `id`, `originLabel`, `originLatitude`, `originLongitude`, `destinationLabel`, `destinationLatitude`, `destinationLongitude`, `createdAt`.

## Success Criteria

- **SC-001**: El 100% de las búsquedas con origen explícito se persisten correctamente.
- **SC-002**: Las búsquedas con origen GPS no generan registros.
- **SC-003**: El historial se muestra en menos de 500 ms con hasta 50 registros.
- **SC-004**: Borrar un ítem o todo el historial actualiza la UI inmediatamente.

## Assumptions

- La app usa SQLite local a través de `expo-sqlite`.
- No hay sincronización remota en esta historia.
- El usuario tiene una sola tabla de historial global (no por ciudad).
- El límite de 50 entradas se implementará en una futura mejora.
