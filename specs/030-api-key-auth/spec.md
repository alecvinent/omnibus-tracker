# Feature Specification: Proteger endpoints de la API con API key

**Feature Branch**: `030-api-key-auth`

**Created**: 2026-11-20

**Status**: Done

**Input**: User description: "Proteger api endpoints con auth. los clientes usaran api key para usar el api. se debe poder gestionar el api key desde el backend (prioritario)"

## User Scenarios & Testing

### User Story 1 - Rechazar requests sin API key (Priority: P0)

Cualquier request a endpoints de negocio sin una API key válida recibe `401 Unauthorized`.

**Why this priority**: Es la protección básica contra uso no autorizado de la API pública.

**Independent Test**: Llamar a `/v1/geocode/search` sin header `X-API-Key` y verificar `401`.

**Acceptance Scenarios**:

1. **Given** un request sin `X-API-Key`, **When** llega a un endpoint protegido, **Then** responde `401`.
2. **Given** un request con `X-API-Key` inválida o revocada, **When** llega a un endpoint protegido, **Then** responde `401`.
3. **Given** un request con `X-API-Key` válida, **Then** se procesa normalmente.

---

### User Story 2 - Gestionar API keys desde el backend (Priority: P0)

Un administrador puede crear, listar, rotar y revocar API keys sin desplegar código nuevo.

**Why this priority**: Permite rotar credenciales y revocar acceso de clientes comprometidos.

**Independent Test**: Crear una key vía endpoint admin, usarla en un request protegido, revocarla y verificar que falla.

**Acceptance Scenarios**:

1. **Given** autenticación de administrador, **When** se crea una key con nombre, **Then** se devuelve el valor una sola vez y se almacena su hash.
2. **Given** autenticación de administrador, **When** se lista keys, **Then** se muestran metadatos sin revelar el valor original.
3. **Given** autenticación de administrador, **When** se revoca una key, **Then** deja de funcionar inmediatamente.

---

### User Story 3 - Cliente móvil envía API key (Priority: P1)

La app móvil carga la API key desde variables de entorno y la envía en cada request al backend.

**Why this priority**: Sin esto la app no puede consumir los endpoints protegidos.

**Independent Test**: Configurar `EXPO_PUBLIC_API_KEY`, realizar una búsqueda y verificar en el backend que llega el header.

**Acceptance Scenarios**:

1. **Given** `EXPO_PUBLIC_API_KEY` configurada, **When** la app llama a geocodificación, **Then** envía `X-API-Key`.
2. **Given** una API key inválida, **When** la app llama al backend, **Then** muestra error de autenticación.

---

### Edge Cases

- Primer deploy: si no hay keys, el endpoint admin permite crear una con `ADMIN_API_KEY`.
- Rotación: crear nueva key, actualizar clientes, revocar anterior.
- Sin `ADMIN_API_KEY` configurado: los endpoints admin se bloquean para evitar exposición.

## Requirements

### Functional Requirements

- **FR-001**: Los endpoints `/v1/geocode/search` y `/v1/trips/plan` DEBEN requerir `X-API-Key` válida.
- **FR-002**: El backend DEBE almacenar hashes de API keys, no el valor en texto plano.
- **FR-003**: El backend DEBE proveer endpoints admin para crear, listar y revocar keys.
- **FR-004**: Los endpoints admin DEBEN requerir `ADMIN_API_KEY` configurado en entorno.
- **FR-005**: La app móvil DEBE enviar `X-API-Key` en requests a `/v1/*`.
- **FR-006**: Ninguna API key real DEBE commitearse al repositorio.

### Key Entities

- **ApiKey**: id, name, key_hash, created_at, revoked_at.
- **Admin operations**: create, list, revoke.

## Success Criteria

- **SC-001**: Request sin key responde `401`.
- **SC-002**: Request con key válida responde `200`.
- **SC-003**: El valor de una key solo se muestra al momento de crearla.
- **SC-004**: `npm run typecheck` y `npm run lint` pasan limpios.

## Assumptions

- Se usa SQLite local en el backend para persistir keys.
- `ADMIN_API_KEY` se configura una sola vez fuera del repositorio.
- No hay necesidad de rate limiting en esta historia.
