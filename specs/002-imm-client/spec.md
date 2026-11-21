# BL-002 · Cliente IMM con autenticación en servidor

**Feature Branch**: `002-imm-client`

**Created**: 2026-11-21

**Status**: In Progress

**Input**: `docs/backlog.md` BL-002.

## User Scenarios & Testing

### User Story 1 - Cliente autenticado sin secretos en el cliente móvil (Priority: P0)

El backend necesita un único punto para consultar la API de la IMM con OAuth2 `client_credentials`, sin exponer credenciales.

**Acceptance Scenarios**:

1. **Given** `IMM_CLIENT_ID` e `IMM_CLIENT_SECRET` configurados en el entorno del backend, **When** se crea el cliente, **Then** obtiene un token de `https://mvdapi-auth.montevideo.gub.uy/token` con `grant_type=client_credentials`.
2. **Given** un token válido, **When** se consultan dos endpoints, **Then** el token se reutiliza hasta cerca de su vencimiento (`expires_in=300`, margen de 30 s).
3. **Given** credenciales ausentes, **When** se crea el cliente desde entorno, **Then** falla con un error de configuración claro, sin imprimir secretos.

### User Story 2 - Errores, timeouts y límite de 10 llamadas/minuto (Priority: P0)

El cliente debe ser resiliente y no superar la cuota documentada por la IMM.

**Acceptance Scenarios**:

1. **Given** una respuesta 429 o 5xx, **When** ocurre, **Then** se reintenta con backoff limitado (2 reintentos por defecto).
2. **Given** más de 10 llamadas en 60 s, **When** se solicita otra, **Then** el cliente espera antes de enviarla.
3. **Given** un timeout o error de red, **When** ocurre, **Then** se lanza un error tipado del dominio, sin credenciales en el mensaje.
4. **Given** un 401, **When** ocurre, **Then** se invalida el token cacheado y se reintenta una vez con token fresco.

### User Story 3 - Operaciones disponibles y tests (Priority: P0)

El cliente expone las operaciones que necesitan las historias siguientes (GTFS, paradas, ETA, posiciones).

**Acceptance Scenarios**:

1. **Given** el cliente, **When** se llaman `get_buses`, `get_bus_stops`, `get_bus_stop_lines`, `get_upcoming_buses`, `get_line_variants`, `get_gtfs_version` y `download_gtfs`, **Then** se construyen las rutas y parámetros del Swagger de la IMM.
2. **Given** los tests unitarios con HTTP mockeado, **When** se ejecutan, **Then** pasan sin contactar la API real.

## Requirements

### Functional Requirements

- **FR-001**: Módulo `backend/app/imm_client.py` con clase `ImmClient` y factory `get_client()` desde variables de entorno.
- **FR-002**: Obtención y cacheo de token OAuth2 con `expires_in` y margen de seguridad.
- **FR-003**: Rate limiter deslizante de 10 llamadas por minuto (configurable en tests).
- **FR-004**: Reintentos ante 429/5xx con backoff exponencial y timeout por petición.
- **FR-005**: Excepciones tipadas: configuración, autenticación, límite de tasa y upstream.
- **FR-006**: Operaciones para buses, paradas, variantes, ETA, versión y ZIP de GTFS.
- **FR-007**: Tests unitarios con `httpx.MockTransport` (sin red real) en `backend/tests/test_imm_client.py`.
- **FR-008**: Documentar el módulo y sus variables en `backend/README.md`.

### Non-Functional Requirements

- **NFR-001**: Ningún log, excepción o mensaje incluye `client_id`, `client_secret` ni `Authorization`.
- **NFR-002**: Sin credenciales en el repositorio; solo `backend/.env.example` con placeholders (BL-001).
- **NFR-003**: El cliente es `async` y usa un único `httpx.AsyncClient` por instancia.
- **NFR-004**: No modificar rutasHTTP públicas existentes (BL-003/BL-004 las consumirán).

## Success Criteria

- **SC-001**: `python -m unittest discover -s backend/tests -t backend` pasa con los nuevos tests.
- **SC-002**: `npm run typecheck`, `npm run lint` y `npm run test` siguen en verde.
- **SC-003**: `ruff check .` y `ruff check --select F` limpios si la herramienta está disponible.
- **SC-004**: BL-002 se marca `done` tras el merge a `develop`.

## Assumptions

- El límite de 10 llamadas/minuto aplica a las peticiones a `api.montevideo.gub.uy`; se aplica también al token para ser conservador.
- `expires_in=300` según verificación real con las credenciales del usuario (2026-11-21).
- No se agrega dependencia nueva: `httpx` ya está en `backend/requirements.txt`.
