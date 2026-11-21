# Seguridad

## Autenticación de clientes con API key

Los endpoints de negocio del backend (`/v1/geocode/search`, `/v1/trips/plan`) requieren un header `X-API-Key`. El backend almacena solo el hash SHA-256 de cada key; el valor en texto plano solo se muestra al momento de crearla.

### Variables de entorno del backend

- `ADMIN_API_KEY`: clave maestra para acceder a los endpoints de administración. Configurarla en el servidor; **no commitearla**.
- `API_KEYS_DB_PATH`: ruta del SQLite que persiste las API keys. Por defecto `backend/data/api_keys.db` (relativo al repositorio).

### Gestión de API keys

Los endpoints admin requieren el header `X-Admin-Key`.

#### Crear una key

```bash
curl -H "X-Admin-Key: $ADMIN_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name":"app-produccion"}' \
     https://omnibus-tracker.fastapicloud.dev/admin/api-keys
```

Respuesta (el campo `key` solo se devuelve una vez):

```json
{
  "id": "abc123",
  "name": "app-produccion",
  "key": "omni_xxxx...",
  "created_at": "just now"
}
```

#### Listar keys activas

```bash
curl -H "X-Admin-Key: $ADMIN_API_KEY" \
     "https://omnibus-tracker.fastapicloud.dev/admin/api-keys?active_only=true"
```

#### Revocar una key

```bash
curl -H "X-Admin-Key: $ADMIN_API_KEY" \
     -X DELETE \
     https://omnibus-tracker.fastapicloud.dev/admin/api-keys/abc123
```

### Rotación de keys (BL-036)

`POST /admin/api-keys/{id}/rotate` — devuelve una nueva key activa (valor **una sola vez**) y revoca la anterior; hereda el nombre de la rotada.

```bash
curl -H "X-Admin-Key: $ADMIN_API_KEY" \
     -X POST \
     https://omnibus-tracker.fastapicloud.dev/admin/api-keys/abc123/rotate
```

```json
{
  "id": "new-id",
  "name": "app-produccion",
  "key": "omni_xxxx...",
  "created_at": "2026-11-21T03:28:35+00:00",
  "rotated_from": {"id": "abc123"}
}
```

Rotación manual sin servidor:

```bash
# inserta la key en el SQLite local y la imprime una sola vez
python backend/scripts/generate_api_key.py --name "app-produccion-2" [--output keyfile.txt]
```

### Registro de keys por cliente (BL-037)

Cada instalación de la APK: la app llama a `POST /register/client-key` (con `name` del cliente y `deviceId`), el backend genera una key única y devuelve el valor una sola vez; la app guarda la key en SQLite local (`client_key`). Los datos del cliente (`name`) quedan almacenados con la key: ver `GET /admin/api-keys`.

### Uso desde la app móvil (BL-030)

(Legacy) Configurar `EXPO_PUBLIC_API_KEY` en `.env`, `.env.dev` o en `eas.json`. La app envía el header automáticamente en `geocoding.ts` y `planner.ts`.

Desde BL-037 cada app registra su propia key al instalar (ver above); `EXPO_PUBLIC_API_KEY` ya no se usa por defecto.

### Rotar desde el cliente

La app puede rotar su key desde el cliente: llama a `POST /admin/api-keys/{id}/rotate` (BL-036), guarda la nueva key en SQLite local y deja de enviar la vieja.

### Endpoints protegidos

| Endpoint | Método | Auth requerida |
|----------|--------|----------------|
| `/health` | GET | Ninguna |
| `/v1/geocode/search` | GET | `X-API-Key` |
| `/v1/trips/plan` | POST | `X-API-Key` |
| `/admin/api-keys` | POST, GET | `X-Admin-Key` |
| `/admin/api-keys/{id}` | DELETE | `X-Admin-Key` |
| `/register/client-key` | POST | `X-Admin-Key` |
| `/admin/api-keys/{id}/rotate` | POST | `X-Admin-Key` |
| `/admin/api-keys/{id}/rotate` | POST | `X-Admin-Key` |

### Rotación de keys

1. Crear una nueva key desde `/admin/api-keys`.
2. Actualizar `EXPO_PUBLIC_API_KEY` en la app y generar un nuevo build.
3. Una vez que todos los clientes usan la nueva key, revocar la anterior.

### Prevención de leaks

- Nunca incluir `ADMIN_API_KEY` ni API keys reales en el repositorio.
- `.env.dev` y `eas.json` usan placeholders (`cambia_por_tu_api_key`).
- En producción, configurar `EXPO_PUBLIC_API_KEY` como secret de EAS o en el servidor de CI.
