# Seguridad

## Autenticación de clientes con API key

Los endpoints de negocio del backend (`/v1/geocode/search`, `/v1/trips/plan`) requieren un header `X-API-Key`. El backend almacena solo el hash SHA-256 de cada key; el valor en texto plano solo se muestra al momento de crearla.

### Variables de entorno del backend

- `ADMIN_API_KEY`: clave maestra para acceder a los endpoints de administración. Configurarla en el servidor; **no commitearla**.
- `API_KEYS_DB_PATH`: ruta del SQLite que persiste las API keys. Por defecto `/data/api_keys.db`.

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

### Uso desde la app móvil

Configurar `EXPO_PUBLIC_API_KEY` en `.env`, `.env.dev` o en `eas.json`. La app envía el header automáticamente en `geocoding.ts` y `planner.ts`.

### Endpoints protegidos

| Endpoint | Método | Auth requerida |
|----------|--------|----------------|
| `/health` | GET | Ninguna |
| `/v1/geocode/search` | GET | `X-API-Key` |
| `/v1/trips/plan` | POST | `X-API-Key` |
| `/admin/api-keys` | POST, GET | `X-Admin-Key` |
| `/admin/api-keys/{id}` | DELETE | `X-Admin-Key` |

### Rotación de keys

1. Crear una nueva key desde `/admin/api-keys`.
2. Actualizar `EXPO_PUBLIC_API_KEY` en la app y generar un nuevo build.
3. Una vez que todos los clientes usan la nueva key, revocar la anterior.

### Prevención de leaks

- Nunca incluir `ADMIN_API_KEY` ni API keys reales en el repositorio.
- `.env.dev` y `eas.json` usan placeholders (`cambia_por_tu_api_key`).
- En producción, configurar `EXPO_PUBLIC_API_KEY` como secret de EAS o en el servidor de CI.
