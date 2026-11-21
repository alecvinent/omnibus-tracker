# Feature Specification: Registro de API keys por cliente (app)

**Feature Branch**: `037-api-key-client-registration`

**Created**: 2026-11-21

**Status**: Done

**Input**: User description: "Cada cliente tiene su propia API key, se tienen los datos de cada cliente. El API key se genera desde el cliente al instalar APK."

## User Scenarios & Testing

### User Story 1 - App registra key propia al instalar (Priority: P0)

Al instalar la APK, si no hay key guardada en el dispositivo, la app llama a `POST /register/client-key`, el backend genera una key única con datos del cliente y devuelve el valor una sola vez; la app guarda la key en SQLite local.

**Independent Test**: Correr app sin key local → app llama al endpoint, key guardada, y el hash válida para endpoints protegidos.

**Acceptance Scenarios**:

1. **Given** app sin key local, **When** arranca la app, **Then** app llama a `POST /register/client-key` y guarda la key recibida.
2. **Given** app ya con key local, **Then** app no llama al endpoint (key ya persistida).
3. **Given** envío a `/v1/*` con key guardada, **Then** el header `X-API-Key` es el key del cliente (200, no 401).

### User Story 2 - Backend genera key de cliente con datos (Priority: P0)

El backend, al recibir `POST /register/client-key`, genera una key única y la almacena con los datos del cliente (nombre del dispositivo); devuelve el valor una sola vez.

**Independent Test**: `curl -X POST /register/client-key -H "X-Admin-Key: ..." -d '{"name": "app-produccion", "deviceId": "M1904F"}'` → 200 con key plain + name; hash en SQLite válido.

**Acceptance Scenarios**:

1. **Given** `ADMIN_API_KEY` configurado, **When** request valida admin, **Then** devuelve `{id, name, key, created_at}`.
2. **Given** request sin admin, **Then** responde 503.
3. **Given** key sin `ADMIN_API_KEY` configurado → 503 (consistente con BL-030).
4. **Given** GET /admin/api-keys → las keys admin incluyen los datos de cliente (`name` del cliente).

### User Story 3 - Rotación desde cliente (Priority: P0)

La app puede rotar su key usando el endpoint admin (`POST /admin/api-keys/{id}/rotate`, BL-036): recibe la nueva key, guarda en SQLite local, y deja de enviar la rotada.

**Independent Test**: Correr rotación en app; verificar key guardada cambió y endpoint protegido responde con la nueva key (200) y la vieja 401.

**Acceptance Scenarios**:

1. **Given** app con key de cliente, **When** app llama a rotar, **Then** app guarda la nueva key.
2. **Given** backend sin ADMIN_API_KEY, **Then** app detecta error y la key local antigua sigue en uso; sin cambio de key.

### Edge Cases

- Primer start sin backend activo: app ignora el fallo de registro (graceful), registro reintenta al siguiente start.
- Ambiente de desarrollo (sin key): comportamiento igual, pero backend dev fine.
- `expo-device` no disponible (browser/web): `getDeviceNameAsync` se lee como "".

## Requirements

### Functional Requirements

- **FR-001**: Backend DEBE exponer `POST /register/client-key` (requiere `ADMIN_API_KEY`; fallback 503 si no configurado) que inserta una key nueva (hash) y devuelve `{id, name, key, created_at}` una sola vez.
- **FR-002**: El nombre de cliente DEBE almacenarse en la key: `name` del cliente del request (o default `Omnibus Tracker - <deviceId>`).
- **FR-003**: GET `/admin/api-keys` DEBE incluir `name` de cliente (dato almacenado con la key).
- **FR-004**: App DEBE persistir key de cliente en SQLite (`client_key` tabla, key + key_id + name).
- **FR-005**: App DEBE enviar `X-API-Key` del cliente en requests a `/v1/geocode/search` y `/v1/trips/plan`.
- **FR-006**: App DEBE poder rotar su key desde cliente via `POST /admin/api-keys/{id}/rotate` (actualiza key local + name).

### Key Entities

- **ApiKey**: id, name (nombre del cliente), key_hash, created_at, revoked_at (existente).
- **ClientKeyRow**: id, key, key_id, name, installed_at (app).

### Implementation Notes

- Backend: `create_api_key(name)` existente reutilizado; endpoint en `main.py`.
- App: `src/services/api-key.ts` — registerClientKey, getClientApiKey, getClientKeyId, rotateClientKey, ensureClientKey.
- App: `src/db/database.ts` — tabla `client_key`.
- App: `geocoding.ts` y `planner.ts` — headers dinámicos desde getClientApiKey.
- App: `app/index.tsx` — `ensureClientKey()` en on mount.
- jest: actualizar `jest.setup.ts` mocks (expo-sqlite, expo-device); nuevos tests en `src/services/api-key.test.ts`.

## Success Criteria

- **SC-001**: App sin key local → registra y guarda key (hash válido en backend).
- **SC-002**: Endpoint admin: 200 con campos correctos; sin ADMIN_API_KEY → 503.
- **SC-003**: Jest de app: register/get/rotate client key (tests verdes).
- **SC-004**: Frontend typecheck & lint limpios (gates del repo).

## Assumptions

- `expo-device` disponible: `Device.getDeviceNameAsync()`.
- SQLite app: `openDatabaseAsync("omnibus-tracker.db")`.
- Registro al instalar APK = `ensureClientKey()` en app start (app abre primera vez).
- Admin list ya muestra `name` — verificado en BL-030/BL-036.
