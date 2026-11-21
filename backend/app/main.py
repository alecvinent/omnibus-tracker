import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.auth import verify_admin_key, verify_api_key
from app.db import (
    create_api_key,
    get_api_key,
    init_db,
    list_api_keys,
    revoke_api_key,
    rotate_api_key,
)
from app.geocode import search_places

app = FastAPI(title="Ómnibus Tracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    init_db()


class Coordinate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class Preferences(BaseModel):
    avoidTransfers: bool = False
    minimizeWalking: bool = True
    accessibleOnly: bool = False


class PlanTripRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    preferences: Preferences
    departureTime: str | None = None


@app.get("/health")
async def health():
    return {"status": "ok", "service": "omnibus-tracker-api"}


class GeocodeResult(BaseModel):
    id: str
    displayName: str
    latitude: float
    longitude: float


@app.get("/v1/geocode/search", response_model=list[GeocodeResult])
async def geocode_search(
    q: str = Query(..., min_length=2, max_length=120),
    limit: int = Query(6, ge=1, le=10),
    cityId: str | None = Query(None, alias="cityId"),
    _api_key: str = Depends(verify_api_key),
):
    try:
        rows = await search_places(q, limit=limit, city_id=cityId)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="El proveedor de geocodificación no respondió.") from exc
    return rows


@app.post("/v1/trips/plan")
async def plan_trip(
    request: PlanTripRequest,
    _api_key: str = Depends(verify_api_key),
):
    # Próxima fase: consultar OpenTripPlanner con el feed GTFS validado.
    # Se responde 503 hasta que exista una fuente de itinerarios configurada.
    raise HTTPException(
        status_code=503,
        detail="El motor de rutas aún no está conectado al GTFS.",
    )


# ---------------------------------------------------------------------------
# Admin endpoints for API key management
# ---------------------------------------------------------------------------


class CreateApiKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)


class CreateApiKeyResponse(BaseModel):
    id: str
    name: str
    key: str
    created_at: str


@app.post("/admin/api-keys", response_model=CreateApiKeyResponse)
def admin_create_api_key(
    body: CreateApiKeyRequest,
    _admin: None = Depends(verify_admin_key),
):
    key_id, plain_key = create_api_key(body.name)
    return {
        "id": key_id,
        "name": body.name,
        "key": plain_key,
        "created_at": "just now",
    }


@app.get("/admin/api-keys")
def admin_list_api_keys(
    active_only: bool = True,
    _admin: None = Depends(verify_admin_key),
):
    return list_api_keys(active_only=active_only)


@app.delete("/admin/api-keys/{key_id}")
def admin_revoke_api_key(
    key_id: str,
    _admin: None = Depends(verify_admin_key),
):
    revoked = revoke_api_key(key_id)
    if not revoked:
        raise HTTPException(status_code=404, detail="API key no encontrada o ya revocada.")
    return {"id": key_id, "status": "revoked"}


class RotatedApiKeyResponse(BaseModel):
    id: str
    name: str
    key: str
    created_at: str
    rotated_from: dict[str, str]


@app.post("/admin/api-keys/{key_id}/rotate", response_model=RotatedApiKeyResponse)
def admin_rotate_api_key(
    key_id: str,
    _admin: None = Depends(verify_admin_key),
):
    """Crea una nueva key activa y revoca la rotada; devuelve el valor una sola vez."""
    existing = get_api_key(key_id)
    if not existing or existing.get("revoked_at") is not None:
        raise HTTPException(status_code=404, detail="API key no encontrada o ya revocada.")
    new_row, plain_key = rotate_api_key(key_id)
    return {
        "id": new_row["id"],
        "name": new_row["name"],
        "key": plain_key,
        "created_at": new_row["created_at"],
        "rotated_from": {"id": key_id},
    }
