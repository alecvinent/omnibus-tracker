# Backend

FastAPI inicial. Mantener aquí las credenciales privadas de la API de la IMM; nunca incluirlas en `EXPO_PUBLIC_*`.

## API de transporte de la IMM (BL-001)

Fuente principal: https://api.montevideo.gub.uy/apidocs/publictransport

1. Crear cuenta gratuita en https://api.montevideo.gub.uy/signup (o usar ID Uruguay).
2. Registrar la aplicación "Ómnibus Tracker" y obtener `client_id` y `client_secret`.
3. Cargar las variables de entorno indicadas abajo. La API usa OAuth2 `client_credentials` contra `https://mvdapi-auth.montevideo.gub.uy/token` y limita las llamadas a **10 por minuto**, por lo que el consumo debe mediar por este backend con caché.

Nunca commits credenciales reales: `backend/.env.example` contiene solo placeholders. Ver `docs/data-sources.md` para endpoints, términos y contacto.

### Cliente IMM (BL-002)

`app/imm_client.py` expone `ImmClient` y el factory `get_client()`. Es `async`, cachea el token OAuth2 (renovación 30 s antes del vencimiento), aplica una ventana deslizante de 10 llamadas/minuto y reintenta 429/5xx con backoff. En un 401 invalida el token y reintenta una vez. Ninguna excepción ni log incluye credenciales.

```python
from app.imm_client import get_client

client = get_client()  # lee IMM_* del entorno
try:
    version = await client.get_gtfs_version()
    buses = await client.get_buses()
finally:
    await client.aclose()
```

También están disponibles `get_bus_stops()`, `get_bus_stop_lines(id)`, `get_upcoming_buses(id, lines)`, `get_line_variants()`, `get_line_variant(id)` y `download_gtfs()`. Los tests unitarios usan `httpx.MockTransport` y no contactan la API real:

```bash
python -m unittest tests.test_imm_client -v
```

## Variables de entorno

- `IMM_CLIENT_ID` / `IMM_CLIENT_SECRET`: credenciales OAuth2 de la app registrada en el portal de la IMM. Solo en el backend; nunca en `EXPO_PUBLIC_*`.
- `IMM_TOKEN_URL`: URL del token OAuth2. Por defecto `https://mvdapi-auth.montevideo.gub.uy/token`.
- `IMM_API_BASE_URL`: base de la API IMM. Por defecto `https://api.montevideo.gub.uy/api/transportepublico`.
- `ADMIN_API_KEY`: clave maestra para gestionar API keys vía `/admin/api-keys`. Configurarla fuera del repositorio.
- `API_KEYS_DB_PATH`: ruta del SQLite con las API keys. Por defecto `backend/data/api_keys.db` (relativo al repositorio). En FastAPI Cloud se puede dejar el default porque la app corre desde `/app`.
- `NOMINATIM_USER_AGENT`: identificador para las peticiones a Nominatim.

## Endpoints públicos/protegidos

- `GET /health` — estado del servicio (público)
- `GET /v1/geocode/search?q=...&limit=6&cityId=...` — búsqueda de lugares (requiere `X-API-Key`)
- `POST /v1/trips/plan` — planificación de viajes (requiere `X-API-Key`)

## Gestión de API keys

Los endpoints admin requieren el header `X-Admin-Key` con el valor de `ADMIN_API_KEY`.

- `POST /admin/api-keys` — crear una nueva key (`{"name": "..."}`). Devuelve el valor **una sola vez**.
- `GET /admin/api-keys?active_only=true` — listar keys.
- `DELETE /admin/api-keys/{id}` — revocar una key.
- `POST /admin/api-keys/{id}/rotate` — rotar una key: crea una nueva activa (valor una sola vez, nombre heredado) y revoca la anterior en una petición.
- `POST /register/client-key` (BL-037) — registro de key por cliente: genera key única con datos del cliente (`name`/`deviceId`), devuelve `{id, name, key, created_at}` una sola vez; requiere `ADMIN_API_KEY`.

Ejemplo:

```bash
curl -H "X-Admin-Key: $ADMIN_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name":"app-produccion"}' \
     https://omnibus-tracker.fastapicloud.dev/admin/api-keys
```

Ver `docs/security.md` para más detalles.

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Generar API keys sin el servidor

```bash
python scripts/generate_api_key.py --name "app-produccion" [--output keyfile.txt]
```

Inserta una key nueva en el SQLite de API keys (`API_KEYS_DB_PATH` o default `data/api_keys.db`) y la imprime una sola vez por stdout (o al archivo `--output`). Útil para crear keys locales contra el mismo `api_keys.db` del backend.

### WSL / Linux

En Ubuntu el venv a veces se crea **sin pip** (`No module named pip`). Tras `source .venv/bin/activate`, el comando `pip` del sistema dispara **externally-managed-environment**.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m ensurepip --upgrade    # solo si falta pip
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Usá siempre `python -m pip`, no el `pip` global. No uses la carpeta `backend/.env` como venv (confunde con variables de entorno); el entorno virtual correcto es `backend/.venv`.

Próxima implementación:
1. Cliente IMM en servidor con OAuth2 `client_credentials`, timeout, reintentos y respeto del límite de 10 llamadas/minuto (BL-002).
2. Descarga/validación periódica del GTFS.
3. OpenTripPlanner como motor de itinerarios.
4. Adaptador de ETA y posición de vehículos.
5. Caché y límites de consulta.
