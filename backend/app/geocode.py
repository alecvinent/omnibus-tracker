"""Búsqueda de lugares vía Nominatim, mediada por el backend (no desde el cliente móvil)."""

from __future__ import annotations

import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "OmnibusTracker/0.1 (transit planner; backend geocode)"
# Viewbox Montevideo: lon/lat esquinas SW y NE
MONTEVIDEO_VIEWBOX = "-56.45,-34.95,-55.95,-34.75"


async def search_places(query: str, *, limit: int = 6) -> list[dict[str, object]]:
    q = query.strip()
    if len(q) < 2:
        return []

    params = {
        "q": q,
        "format": "json",
        "limit": min(limit, 10),
        "countrycodes": "uy",
        "viewbox": MONTEVIDEO_VIEWBOX,
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