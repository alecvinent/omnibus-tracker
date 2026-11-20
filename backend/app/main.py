import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.geocode import search_places

app = FastAPI(title="Ómnibus Tracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
):
    try:
        rows = await search_places(q, limit=limit)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="El proveedor de geocodificación no respondió.") from exc
    return rows


@app.post("/v1/trips/plan")
async def plan_trip(request: PlanTripRequest):
    # Próxima fase: consultar OpenTripPlanner con el feed GTFS validado.
    # Se responde 503 hasta que exista una fuente de itinerarios configurada.
    raise HTTPException(
        status_code=503,
        detail="El motor de rutas aún no está conectado al GTFS de Montevideo.",
    )
