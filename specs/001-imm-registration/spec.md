# BL-001 · Registrar la aplicación en el portal de APIs de la IMM y verificar límites/credenciales

**Feature Branch**: `001-imm-registration`

**Created**: 2026-11-21

**Status**: In Progress

**Input**: Backlog BL-001: sin registro no hay acceso a la API pública de transporte de la IMM (posiciones en tiempo real, ETA y GTFS). Registrar la app, obtener credenciales y documentar límites/cuotas.

**Decisión vigente (2026-11-21)**: se usa `https://api.montevideo.gub.uy/apidocs/publictransport` como fuente de la API de transporte. La cuenta/credenciales son un paso manual del usuario; este ticket prepara documentación y configuración sin secretos en el repositorio.

## Fuente verificada

- Portal: `https://api.montevideo.gub.uy`
- Registro: `https://api.montevideo.gub.uy/signup` (cuenta gratuita; Organization/Nombre de grupo, usuario, email y contraseña; también permite `ID Uruguay`)
- Login: `https://api.montevideo.gub.uy/login`
- Documentación: `https://api.montevideo.gub.uy/apidocs/publictransport`
- Especificación Swagger 2.0: `https://api.montevideo.gub.uy/swagger/spec/publictransport.json`
- Base path: `/api/transportepublico` (host `api.montevideo.gub.uy`, HTTPS)
- OAuth2: `client_credentials` ("application" flow), token URL `https://mvdapi-auth.montevideo.gub.uy/token`
- Límite: **10 llamadas por minuto**; el propio portal indica que debe invocarse desde un backend, no directamente desde la app móvil
- Términos: `https://ckan.montevideo.gub.uy/im/docs/Terminos%20y%20condiciones%20de%20uso%20-%20Portal%20Datos%20Abiertos%20IM.pdf`
- Contacto: `pci@imm.gub.uy`

### Endpoints relevantes

| Endpoint | Uso |
| --- | --- |
| `GET /buses` | Posiciones de vehículos en tiempo real (filtros: `company`, `lines`, `lineVariantIds`, `busId`, `busstopId`, `format=geojson`) |
| `GET /buses/busstops` | Listado de paradas |
| `GET /buses/busstops/{busstopId}/lines` | Líneas por parada |
| `GET /buses/busstops/{busstopId}/upcomingbuses` | ETA por parada (requiere `lines`) |
| `GET /buses/linevariants` · `GET /buses/linevariants/{lineVariantId}` | Variantes de línea |
| `GET /buses/gtfs/static/latest/version.txt` | Versión del GTFS publicado por la IMM |
| `GET /buses/gtfs/static/latest/google_transit.zip` | GTFS estático de la IMM |
| `GET /buses/geo` | Obsoleto; no usar |

La mayoría de las operaciones `buses` declaran `security: OAuth2`; `GET /buses` no lo declara en el Swagger, pero las condiciones de uso exigen cuenta gratuita, así que el cliente debe autenticarse de todas formas.

## User Scenarios & Testing

### User Story 1 - Registro en portal IMM (Priority: P0)

El usuario registra la aplicación en el portal de desarrolladores de la IMM y obtiene credenciales.

**Acceptance Scenarios**:

1. **Given** acceso al portal IMM, **When** se completa el registro en `/signup`, **Then** se obtienen `client_id` y `client_secret` para el flujo OAuth2 `client_credentials`.
2. **Given** las credenciales, **When** se almacenan solo en el backend (fuera del repo), **Then** el backend puede solicitar un token en `https://mvdapi-auth.montevideo.gub.uy/token`.

### User Story 2 - Documentar límites y cuotas (Priority: P0)

Los límites y condiciones de la API IMM deben estar documentados para el backend.

**Acceptance Scenarios**:

1. **Given** la documentación oficial y el Swagger, **When** se consultan, **Then** se registran en `docs/data-sources.md`: auth OAuth2, token URL, endpoints, límite de 10 llamadas/minuto, términos y contacto.
2. **Given** el límite de 10 llamadas/minuto, **When** se diseña el consumo, **Then** se documenta que las llamadas deben mediar por backend con caché, sin invocarse desde el cliente móvil.

### User Story 3 - Credenciales rotables y fuera del repo (Priority: P0)

Las credenciales nunca deben commitearse; deben configurarse en entorno.

**Acceptance Scenarios**:

1. **Given** el backend, **When** se configuran `IMM_CLIENT_ID` y `IMM_CLIENT_SECRET` como variables de entorno, **Then** el backend funciona sin secretos en código ni en `EXPO_PUBLIC_*`.
2. **Given** `backend/.env.example`, **When** se revisa, **Then** contiene solo placeholders (`cambia_por_tu_client_id`, etc.), nunca valores reales.

## Requirements

### Functional Requirements

- **FR-001**: Registrar app en el portal IMM (paso manual por usuario).
- **FR-002**: Obtener `client_id` y `client_secret` (flujo OAuth2 client credentials).
- **FR-003**: Documentar endpoints, auth, límites y cuotas en `docs/data-sources.md`.
- **FR-004**: Configurar variables de entorno en el backend (`IMM_CLIENT_ID`, `IMM_CLIENT_SECRET`, `IMM_TOKEN_URL`, `IMM_API_BASE_URL`).
- **FR-005**: Actualizar `backend/README.md` y `docs/` con instrucciones de configuración y uso mediado por backend.
- **FR-006**: Mantener la URL de API de desarrollo `https://omnibus-tracker.fastapicloud.dev/` sin cambios.

### Non-Functional Requirements

- **NFR-001**: Sin credenciales en el repositorio ni en variables `EXPO_PUBLIC_*`.
- **NFR-002**: Respetar el límite de 10 llamadas/minuto con caché y agregación en backend (detalle en BL-002/BL-005).
- **NFR-003**: No simular líneas, horarios ni paradas; usar solo datos de la API/GTFS de la IMM.
- **NFR-004**: Preservar trabajo no commiteado de otros tickets (por ejemplo BL-037 en `backend/README.md`).

## Success Criteria

- **SC-001**: Paso manual de registro documentado con URLs exactas; credenciales almacenadas solo en entorno del backend.
- **SC-002**: `docs/data-sources.md` describe auth, endpoints, límite, términos y contacto de la API IMM.
- **SC-003**: `npm run typecheck`, `npm run lint` y tests pasan antes del merge.
- **SC-004**: BL-001 se marca `done` recién tras merge a `develop` y actualización de docs.

## Assumptions

- El flujo OAuth2 es `client_credentials` contra `https://mvdapi-auth.montevideo.gub.uy/token`, según el Swagger publicado.
- El usuario tiene o creará una cuenta gratuita en el portal; hasta entonces el alta de credenciales queda como paso manual bloqueante para consumo real.
- El feed GTFS de la IMM (`/buses/gtfs/static/latest/google_transit.zip`) es la fuente estática a validar en BL-003. Se identificó además un feed público del MTOP en `catalogodatos.gub.uy` como referencia complementaria, pero no reemplaza la decisión de usar la API IMM.
