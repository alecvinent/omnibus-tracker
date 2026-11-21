import os

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

from app.db import is_valid_api_key

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")


async def verify_api_key(api_key: str | None = Security(api_key_header)) -> str:
    if not api_key:
        raise HTTPException(status_code=401, detail="Falta el header X-API-Key.")
    if not is_valid_api_key(api_key):
        raise HTTPException(status_code=401, detail="API key inválida o revocada.")
    return api_key


def verify_admin_key(admin_key: str | None = Security(APIKeyHeader(name="X-Admin-Key", auto_error=False))) -> None:
    if not ADMIN_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="ADMIN_API_KEY no está configurado en el servidor.",
        )
    if not admin_key or admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Acceso denegado.")
