# Feature Specification: Actualizar guía de desarrollo Android a tiles y API key de producción

**Feature Branch**: `034-android-dev-guide-update`

**Created**: 2026-11-20

**Status**: Done

**Input**: User request: actualizar `docs/desarrollo-android-local.md` para reflejar tiles de producción y API key.

## User Scenarios & Testing

### User Story 1 - Guía con variables de entorno actuales (Priority: P2)

Un desarrollador nuevo sigue `docs/desarrollo-android-local.md` y configura correctamente el backend, el estilo de mapa y la API key sin usar valores obsoletos.

**Why this priority**: Evita errores de MapLibre y 401 al seguir la documentación.

**Independent Test**: Seguir la guía paso a paso y verificar que el mapa carga y el autocomplete responde.

**Acceptance Scenarios**:

1. **Given** la guía de desarrollo Android, **When** se configura `.env`, **Then** no se usa `demotiles.maplibre.org`.
2. **Given** la guía de desarrollo Android, **When** se configura `.env`, **Then** incluye `EXPO_PUBLIC_API_KEY`.

---

### User Story 2 - Rutas de APK correctas (Priority: P2)

La guía refleja que `npm run android:apk` genera una APK release standalone en `android/app/build/outputs/apk/release/app-release.apk`.

**Why this priority**: Evita confusión entre debug/dev client y release standalone.

**Independent Test**: Verificar que las rutas en la guía coinciden con la salida real del script.

**Acceptance Scenarios**:

1. **Given** la sección de build de la guía, **When** se ejecuta `npm run android:apk`, **Then** la ruta de salida coincide.

## Requirements

### Functional Requirements

- **FR-001**: La guía DEBE usar `EXPO_PUBLIC_MAP_STYLE_URL` de CARTO Voyager.
- **FR-002**: La guía DEBE incluir `EXPO_PUBLIC_API_KEY` como variable requerida.
- **FR-003**: La guía DEBE reflejar que la APK local es release standalone.

## Success Criteria

- **SC-001**: No quedan referencias a `demotiles.maplibre.org` en la guía.
- **SC-002**: `npm run typecheck` y `npm run lint` pasan limpios.

## Assumptions

- El desarrollador tiene acceso a una API key válida para el entorno de desarrollo.
