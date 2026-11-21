# Feature Specification: Mejorar calidad visual de los tiles del mapa

**Feature Branch**: `023-tile-quality`

**Created**: 2026-11-20

**Status**: In Progress

**Input**: User description: "Mejorar calidad visual de los tiles del mapa"

## User Scenarios & Testing

### User Story 1 - Reemplazar tiles demo por un proveedor de producción (Priority: P1)

El mapa nativo actual usa `demotiles.maplibre.org`, que es de baja calidad y solo sirve para desarrollo. Se requiere un proveedor real que muestre calles, nombres y puntos de referencia legibles al zoom de ruta.

**Why this priority**: Sin tiles de calidad, la experiencia de navegación en la app no es usable.

**Independent Test**: Abrir el mapa en un dev client Android y verificar que se cargan calles y etiquetas claras.

**Acceptance Scenarios**:

1. **Given** que la app abre el mapa, **When** se carga el estilo, **Then** se ven calles, nombres de calles y puntos de referencia legibles.
2. **Given** que no hay API key configurada, **When** se elige el proveedor, **Then** funciona sin key o con una key opcional documentada.

---

### User Story 2 - Comparar y documentar proveedores (Priority: P1)

Elegir al menos dos proveedores de tiles, compararlos y documentar la decisión para que el equipo pueda cambiar en el futuro sin adivinar.

**Why this priority**: Asegura que la elección sea consciente y reversible.

**Independent Test**: Leer `docs/deployment.md` y ver una tabla comparativa con pros/contras de cada opción.

**Acceptance Scenarios**:

1. **Given** la documentación de despliegue, **When** se busca la sección de tiles, **Then** se encuentra una comparativa de al menos dos proveedores.
2. **Given** la configuración del proyecto, **When** se cambia `EXPO_PUBLIC_MAP_STYLE_URL`, **Then** el mapa usa el nuevo estilo sin modificar código.

---

### Edge Cases

- Proveedor caído: el mapa quedará en blanco; no se debe bloquear la app (MapLibre maneja el error internamente).
- Sin conexión: el mapa no carga tiles; es comportamiento esperado.
- Estilo inválido: MapLibre mostrará un error en consola; la app no debería crashear.

## Requirements

### Functional Requirements

- **FR-001**: El sistema DEBE dejar de usar `demotiles.maplibre.org` en builds de desarrollo/preview/producción.
- **FR-002**: El sistema DEBE permitir cambiar el proveedor de tiles mediante `EXPO_PUBLIC_MAP_STYLE_URL`.
- **FR-003**: La documentación DEBE comparar al menos dos proveedores y justificar la elección principal.
- **FR-004**: El proveedor elegido DEBE ser usable sin API key o con una key gratuita documentada.

### Key Entities

- **MAP_STYLE_URL**: URL del JSON de estilo MapLibre cargado por `MapView.native.tsx`.

## Success Criteria

- **SC-001**: Los tiles muestran calles y etiquetas legibles al zoom 13-16 en Montevideo.
- **SC-002**: La comparativa de proveedores está documentada.
- **SC-003**: `npm run typecheck` y `npm run lint` pasan limpios.

## Assumptions

- No se requiere mapa offline en esta historia.
- El proveedor elegido tiene cobertura global/OSM suficiente para Montevideo.
- MapLibre React Native soporta estilos vectoriales GL v8.
