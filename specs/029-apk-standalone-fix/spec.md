# Feature Specification: Fix APK standalone local en blanco

**Feature Branch**: `029-apk-standalone-fix`

**Created**: 2026-11-20

**Status**: Done

**Input**: User report: "en el telefono, la apk se queda en blanco".

## User Scenarios & Testing

### User Story 1 - APK que abre sola en el teléfono (Priority: P0)

El usuario genera la APK con `npm run android:apk`, la instala en su teléfono y la abre sin necesidad de tener la PC corriendo Metro. La app debe mostrar la pantalla principal.

**Why this priority**: Sin esto no hay forma de probar la app fuera de la PC; el MVP requiere poder validar en dispositivo real.

**Independent Test**: Desinstalar cualquier versión anterior, instalar `android/app/build/outputs/apk/release/app-release.apk`, abrirla con Wi‑Fi y datos móviles apagados (sin Metro) y verificar que carga la home.

**Acceptance Scenarios**:

1. **Given** que la APK se generó con `npm run android:apk`, **When** el usuario la instala y abre sin Metro, **Then** ve la pantalla principal con título, buscador y mapa.
2. **Given** que la app abrió sola, **When** el usuario escribe un destino, **Then** el autocomplete consulta al backend si hay conectividad.

---

### User Story 2 - Inicialización de SQLite idempotente (Priority: P0)

La app no debe fallar al abrirse por segunda vez porque la columna `city_id` ya existe.

**Why this priority**: Un error silenciado en la inicialización de la base deja preferencias sin valor por defecto y ensucia los logs; en release puede empeorar.

**Independent Test**: Abrir la app, cerrarla por completo y volver a abrirla; verificar en logcat que no aparece `duplicate column name: city_id`.

**Acceptance Scenarios**:

1. **Given** que la app ya inicializó la base una vez, **When** se vuelve a abrir, **Then** `initializeDatabase` termina sin error.
2. **Given** que la app es nueva, **When** se abre por primera vez, **Then** se crea la tabla `preferences` con la columna `city_id`.

---

### User Story 3 - Build limpio de calidad estática (Priority: P1)

El repositorio debe pasar `npm run typecheck` y `npm run lint` sin errores.

**Why this priority**: BL-010 exige que estos gates estén limpios antes de mergear cualquier cambio.

**Independent Test**: Ejecutar `npm run typecheck && npm run lint` y confirmar salida 0.

**Acceptance Scenarios**:

1. **Given** que se hizo checkout de la rama del fix, **When** se corre `npm run typecheck`, **Then** no hay errores.
2. **Given** que se hizo checkout de la rama del fix, **When** se corre `npm run lint`, **Then** no hay errores.

---

### Edge Cases

- ¿Qué pasa si no hay conectividad? La app abre igual; el autocomplete y la planificación mostrarán errores controlados.
- ¿Qué pasa si el teléfono tiene arquitectura distinta a `arm64-v8a`? Por ahora el script sigue targeteando `arm64-v8a`; si se requiere más tarde se ampliará.
- ¿Qué pasa si el usuario quiere debug? Se mantiene `npm run android` (expo run:android) para desarrollo con Metro.

## Requirements

### Functional Requirements

- **FR-001**: `npm run android:apk` DEBE producir una APK release con el bundle JS embebido.
- **FR-002**: El script de build DEBE setear `NODE_ENV=production` para que Expo empaquete las variables de entorno correctamente.
- **FR-003**: `src/db/database.ts` DEBE ser idempotente al agregar la columna `city_id`.
- **FR-004**: `src/components/MapView.native.tsx` DEBE compilar sin errores de tipo.

### Key Entities

- Ninguno nuevo.

## Success Criteria

- **SC-001**: La APK generada abre sola en un teléfono Android sin Metro.
- **SC-002**: `npm run typecheck` y `npm run lint` pasan sin errores.
- **SC-003**: No hay errores de SQLite `duplicate column name: city_id` en logs.
- **SC-004**: La documentación de prueba en dispositivo refleja el nuevo comportamiento.

## Assumptions

- El perfil de release en `android/app/build.gradle` usa `signingConfigs.debug`, por lo que no se requiere keystore adicional para builds locales.
- `expo-dev-client` permanece en dependencies; la app release lo ignorará en runtime.
- El backend sigue disponible en `EXPO_PUBLIC_API_URL` para pruebas con conectividad.
