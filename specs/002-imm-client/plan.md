# Plan: BL-002 · Cliente IMM en servidor

**Input**: `specs/002-imm-client/spec.md`

## Arquitectura

- `backend/app/imm_client.py` (nuevo): `ImmClient`, factory `get_client()`, excepciones tipadas.
- `backend/tests/test_imm_client.py` (nuevo): tests con `httpx.MockTransport`.
- `backend/README.md`: sección de uso y variables (sin modificar otro trabajo).
- Sin cambios en `backend/app/main.py`: el consumo de rutas llega en BL-003+.

## Decisiones de implementación

1. **HTTP**: un `httpx.AsyncClient` por instancia, inyectable en tests (`client` opcional). Timeout configurables.
2. **Token**: `POST {IMM_TOKEN_URL}` con Basic Auth y `grant_type=client_credentials`. Cache en memoria con `expires_at = now + expires_in - 30`. `asyncio.Lock` evita renovaciones simultáneas.
3. **Rate limiting**: ventana deslizante con `deque` de timestamps y `asyncio.Lock`; `rate_limit=10`, `rate_window=60`. Parámetros inyectables para tests.
4. **Reintentos**: 429/5xx y errores de transporte; `max_retries=2`, backoff `backoff_base * 2**intent`. En 401 se fuerza refresh de token y se reintenta una vez.
5. **Errores**: `ImmConfigurationError`, `ImmAuthenticationError`, `ImmRateLimitError`, `ImmUpstreamError`. Mensajes con código de estado y ruta, nunca credenciales ni headers.
6. **Operaciones**: `get_buses`, `get_bus_stops`, `get_bus_stop_lines`, `get_upcoming_buses`, `get_line_variants`, `get_line_variant`, `get_gtfs_version`, `download_gtfs`.

## Orden de implementación

1. Crear rama `feature/002-imm-client` desde `develop` (hecho).
2. Escribir spec/plan/tasks y pasar analyze.
3. Implementar `imm_client.py`.
4. Implementar tests con HTTP mockeado.
5. Actualizar `backend/README.md` y backlog.
6. Gates y merge a `develop`.

## Riesgos

- El portal podría contar el token dentro de la cuota: se aplica rate limit también al token.
- Tests con sleeps lentos: usar `backoff_base=0` y `rate_limit` alto en tests.
