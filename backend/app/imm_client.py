"""Cliente async para la API de transporte público de la IMM (BL-002).

Toda la autenticación ocurre en el servidor: las credenciales se leen de
variables de entorno y nunca se registran ni se incluyen en mensajes de error.
"""

from __future__ import annotations

import asyncio
import os
import time
from collections import deque
from typing import Any, Self

import httpx

DEFAULT_TOKEN_URL = "https://mvdapi-auth.montevideo.gub.uy/token"
DEFAULT_API_BASE_URL = "https://api.montevideo.gub.uy/api/transportepublico"
DEFAULT_TIMEOUT = 10.0
DEFAULT_RATE_LIMIT = 10
DEFAULT_RATE_WINDOW = 60.0
TOKEN_EXPIRY_SKEW = 30.0


class ImmConfigurationError(RuntimeError):
    """Faltan credenciales o configuración del cliente."""


class ImmAuthenticationError(RuntimeError):
    """La IMM rechazó las credenciales o el token."""


class ImmRateLimitError(RuntimeError):
    """Se agotó el límite de llamadas de la IMM."""


class ImmUpstreamError(RuntimeError):
    """Error de red, timeout o respuesta inválida de la IMM."""


class ImmClient:
    """Cliente OAuth2 con cacheo de token, rate limit y reintentos."""

    def __init__(
        self,
        client_id: str | None = None,
        client_secret: str | None = None,
        *,
        token_url: str | None = None,
        api_base_url: str | None = None,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = 2,
        rate_limit: int = DEFAULT_RATE_LIMIT,
        rate_window: float = DEFAULT_RATE_WINDOW,
        backoff_base: float = 0.5,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._client_id = client_id or os.getenv("IMM_CLIENT_ID")
        self._client_secret = client_secret or os.getenv("IMM_CLIENT_SECRET")
        if not self._client_id or not self._client_secret:
            raise ImmConfigurationError(
                "Faltan IMM_CLIENT_ID / IMM_CLIENT_SECRET en el entorno del backend."
            )

        self._token_url = token_url or os.getenv("IMM_TOKEN_URL", DEFAULT_TOKEN_URL)
        self._api_base_url = api_base_url or os.getenv(
            "IMM_API_BASE_URL", DEFAULT_API_BASE_URL
        ).rstrip("/")
        self._max_retries = max(0, max_retries)
        self._rate_limit = max(1, rate_limit)
        self._rate_window = max(0.001, rate_window)
        self._backoff_base = max(0.0, backoff_base)

        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(timeout=timeout)

        self._token: str | None = None
        self._token_expires_at = 0.0
        self._token_lock = asyncio.Lock()
        self._rate_lock = asyncio.Lock()
        self._calls: deque[float] = deque()

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *_exc: object) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    def _invalidate_token(self) -> None:
        self._token = None
        self._token_expires_at = 0.0

    async def _acquire_slot(self) -> None:
        """Ventana deslizante: como máximo `rate_limit` llamadas por `rate_window`."""
        loop = asyncio.get_running_loop()
        while True:
            async with self._rate_lock:
                now = loop.time()
                while self._calls and now - self._calls[0] >= self._rate_window:
                    self._calls.popleft()
                if len(self._calls) < self._rate_limit:
                    self._calls.append(now)
                    return
                wait = self._rate_window - (now - self._calls[0])
            await asyncio.sleep(max(wait, 0.001))

    async def _request_token(self) -> str:
        await self._acquire_slot()
        try:
            response = await self._client.post(
                self._token_url,
                data={"grant_type": "client_credentials"},
                auth=(self._client_id, self._client_secret),
                headers={"Accept": "application/json"},
            )
        except httpx.TimeoutException as exc:
            raise ImmUpstreamError("Timeout al solicitar el token de la IMM.") from exc
        except httpx.HTTPError as exc:
            raise ImmUpstreamError("Error de red al solicitar el token de la IMM.") from exc

        if response.status_code == 401:
            raise ImmAuthenticationError("La IMM rechazó las credenciales (401).")
        if response.status_code >= 500:
            raise ImmUpstreamError(
                f"La IMM devolvió {response.status_code} al solicitar el token."
            )
        if response.status_code != 200:
            raise ImmAuthenticationError(
                f"La IMM devolvió {response.status_code} al solicitar el token."
            )

        try:
            payload = response.json()
            token = str(payload["access_token"])
            expires_in = float(payload.get("expires_in", 300))
        except (ValueError, KeyError, TypeError) as exc:
            raise ImmUpstreamError("Respuesta de token de la IMM inválida.") from exc

        self._token = token
        self._token_expires_at = time.monotonic() + max(
            expires_in - TOKEN_EXPIRY_SKEW, 1.0
        )
        return token

    async def _get_token(self) -> str:
        if self._token and time.monotonic() < self._token_expires_at:
            return self._token
        async with self._token_lock:
            if self._token and time.monotonic() < self._token_expires_at:
                return self._token
            return await self._request_token()

    async def _sleep_backoff(self, attempt: int) -> None:
        delay = self._backoff_base * (2**attempt)
        if delay > 0:
            await asyncio.sleep(delay)

    async def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        response_kind: str = "json",
    ) -> Any:
        """Ejecuta una petición autenticada. `path` empieza con '/'."""
        url = f"{self._api_base_url}{path}"
        refreshed = False

        for attempt in range(self._max_retries + 1):
            token = await self._get_token()
            await self._acquire_slot()
            try:
                response = await self._client.request(
                    method,
                    url,
                    params=params,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/json",
                    },
                )
            except httpx.TimeoutException as exc:
                if attempt < self._max_retries:
                    await self._sleep_backoff(attempt)
                    continue
                raise ImmUpstreamError(
                    f"Timeout en {path} tras {attempt + 1} intentos."
                ) from exc
            except httpx.HTTPError as exc:
                if attempt < self._max_retries:
                    await self._sleep_backoff(attempt)
                    continue
                raise ImmUpstreamError(
                    f"Error de red en {path} tras {attempt + 1} intentos."
                ) from exc

            status = response.status_code
            if status == 401 and not refreshed:
                refreshed = True
                self._invalidate_token()
                continue
            if status == 401:
                raise ImmAuthenticationError(f"Token rechazado por la IMM en {path}.")
            if status == 429:
                if attempt < self._max_retries:
                    await self._sleep_backoff(attempt)
                    continue
                raise ImmRateLimitError(f"Límite de llamadas de la IMM en {path}.")
            if status >= 500:
                if attempt < self._max_retries:
                    await self._sleep_backoff(attempt)
                    continue
                raise ImmUpstreamError(f"La IMM devolvió {status} en {path}.")
            if status >= 400:
                raise ImmUpstreamError(f"La IMM devolvió {status} en {path}.")

            if response_kind == "bytes":
                return response.content
            if response_kind == "text":
                return response.text
            try:
                return response.json()
            except ValueError as exc:
                raise ImmUpstreamError(f"Respuesta JSON inválida en {path}.") from exc

        raise ImmUpstreamError(f"No se pudo completar la solicitud a {path}.")

    # --- Operaciones de la API (según swagger publictransport) -------------

    async def get_buses(
        self,
        *,
        company: str | None = None,
        line_variant_ids: list[int] | None = None,
        bus_id: int | None = None,
        bus_stop_id: int | None = None,
        lines: list[str] | None = None,
        response_format: str | None = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {}
        if company:
            params["company"] = company
        if line_variant_ids:
            params["lineVariantIds"] = line_variant_ids
        if bus_id is not None:
            params["busId"] = bus_id
        if bus_stop_id is not None:
            params["busstopId"] = bus_stop_id
        if lines:
            params["lines"] = lines
        if response_format:
            params["format"] = response_format
        return await self.request("GET", "/buses", params=params)

    async def get_bus_stops(self) -> list[dict[str, Any]]:
        return await self.request("GET", "/buses/busstops")

    async def get_bus_stop_lines(self, bus_stop_id: int) -> list[dict[str, Any]]:
        return await self.request("GET", f"/buses/busstops/{bus_stop_id}/lines")

    async def get_upcoming_buses(
        self,
        bus_stop_id: int,
        lines: list[str],
        *,
        amount_per_line: int | None = None,
        response_format: str | None = None,
    ) -> list[dict[str, Any]]:
        if not lines:
            raise ValueError("`lines` es obligatorio para consultar ETA.")
        params: dict[str, Any] = {"lines": ",".join(lines)}
        if amount_per_line is not None:
            params["amountperline"] = amount_per_line
        if response_format:
            params["format"] = response_format
        return await self.request(
            "GET", f"/buses/busstops/{bus_stop_id}/upcomingbuses", params=params
        )

    async def get_line_variants(self) -> list[dict[str, Any]]:
        return await self.request("GET", "/buses/linevariants")

    async def get_line_variant(self, line_variant_id: str) -> list[dict[str, Any]]:
        return await self.request("GET", f"/buses/linevariants/{line_variant_id}")

    async def get_gtfs_version(self) -> str:
        version = await self.request(
            "GET", "/buses/gtfs/static/latest/version.txt", response_kind="text"
        )
        return str(version).strip()

    async def download_gtfs(self) -> bytes:
        return await self.request(
            "GET", "/buses/gtfs/static/latest/google_transit.zip", response_kind="bytes"
        )


def get_client() -> ImmClient:
    """Factory que lee la configuración desde variables de entorno."""
    return ImmClient()
