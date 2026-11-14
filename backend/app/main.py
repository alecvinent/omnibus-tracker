from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Ómnibus Tracker API", version="0.1.0")


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


@app.post("/v1/trips/plan")
async def plan_trip(request: PlanTripRequest):
    # Próxima fase: consultar OpenTripPlanner con el feed GTFS validado.
    # Se responde 503 hasta que exista una fuente de itinerarios configurada.
    raise HTTPException(
        status_code=503,
        detail="El motor de rutas aún no está conectado al GTFS de Montevideo.",
    )
