# Backend

FastAPI inicial. Mantener aquí las credenciales privadas de la API de la IMM; nunca incluirlas en `EXPO_PUBLIC_*`.

## Variables de entorno

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
1. Cliente IMM con autenticación en servidor.
2. Descarga/validación periódica del GTFS.
3. OpenTripPlanner como motor de itinerarios.
4. Adaptador de ETA y posición de vehículos.
5. Caché y límites de consulta.
