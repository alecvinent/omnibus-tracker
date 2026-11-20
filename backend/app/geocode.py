"""Búsqueda de lugares vía Nominatim, mediada por el backend (no desde el cliente móvil)."""

from __future__ import annotations

import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "OmnibusTracker/0.1 (transit planner; backend geocode)"

# Configuración por ciudad soportada. viewbox: lon/lat esquinas SW y NE.
CITIES: dict[str, dict[str, str]] = {
    "montevideo-uy": {
        "name": "la ciudad por defecto",
        "countrycodes": "uy",
        "viewbox": "-56.45,-34.95,-55.95,-34.75",
    },
}

DEFAULT_CITY_ID = "montevideo-uy"


def get_city_config(city_id: str | None) -> dict[str, str]:
    return CITIES.get(city_id or DEFAULT_CITY_ID, CITIES[DEFAULT_CITY_ID])


async def search_places(
    query: str,
    *,
    limit: int = 6,
    city_id: str | None = None,
) -> list[dict[str, object]]:
    q = query.strip()
    if len(q) < 2:
        return []

    city = get_city_config(city_id)

    params = {
        "q": q,
        "format": "json",
        "limit": min(limit, 10),
        "countrycodes": city["countrycodes"],
        "viewbox": city["viewbox"],
        "bounded": "1",
        "addressdetails": "0",
    }
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "es"}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(NOMINATIM_URL, params=params, headers=headers)
        response.raise_for_status()
        raw = response.json()

    results: list[dict[str, object]] = []
    for item in raw:
        try:
            results.append(
                {
                    "id": str(item["place_id"]),
                    "displayName": str(item["display_name"]),
                    "latitude": float(item["lat"]),
                    "longitude": float(item["lon"]),
                }
            )
        except (KeyError, TypeError, ValueError):
            continue
    return results
