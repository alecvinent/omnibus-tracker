# BL-035 · Backend falla al iniciar en FastAPI Cloud por ruta de SQLite no escribible

**Status**: In Progress

## Problemática

En producción (FastAPI Cloud) el contenedor no tiene permisos para crear el directorio `/data`. `backend/app/db.py` usa `/data/api_keys.db` como default, lo que provoca:

```
PermissionError: [Errno 13] Permission denied: '/data'
```

Esto ocurre durante `init_db()` en el startup de FastAPI, haciendo que la aplicación falle por completo.

## Objetivo

Cambiar la ruta por defecto de la base de datos SQLite a una ubicación escribible dentro del contenedor (`/app/data/api_keys.db` o relativa al proyecto), manteniendo la posibilidad de sobreescribirla con `API_KEYS_DB_PATH`.

## Criterios de aceptación

- [ ] `backend/app/db.py` usa una ruta por defecto dentro del proyecto.
- [ ] `API_KEYS_DB_PATH` sigue funcionando como override.
- [ ] El directorio de datos está ignorado por git.
- [ ] `backend/README.md` refleja el nuevo default.
- [ ] Gates del frontend (`npm run typecheck`, `npm run lint`) pasan.

## Notas técnicas

- FastAPI Cloud ejecuta la app desde `/app`, por lo que `/app/data` es escribible.
- Para desarrollo local, una ruta relativa a `backend/` (por ejemplo `backend/data/api_keys.db`) evita sorpresas entre entornos.
