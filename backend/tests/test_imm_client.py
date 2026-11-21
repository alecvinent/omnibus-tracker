"""Tests unitarios del cliente IMM (BL-002) con HTTP mockeado, sin red real.

Ejecutar desde `backend/`:
    python -m unittest tests.test_imm_client -v
"""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.imm_client import (
    ImmClient,
    ImmConfigurationError,
    ImmRateLimitError,
    ImmUpstreamError,
)

from app import imm_client

CLIENT_ID = "test-client-id"
CLIENT_SECRET = "test-client-secret-value"


class ImmClientTests(unittest.IsolatedAsyncioTestCase):
    def make_client(self, handler, **kwargs):
        http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        self.addAsyncCleanup(http.aclose)
        kwargs.setdefault("client_id", CLIENT_ID)
        kwargs.setdefault("client_secret", CLIENT_SECRET)
        kwargs.setdefault("rate_limit", 1000)
        kwargs.setdefault("backoff_base", 0.0)
        return ImmClient(client=http, **kwargs)

    async def test_token_is_fetched_once_and_reused(self):
        token_calls = []
        api_calls = []

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/token":
                token_calls.append(request)
                return httpx.Response(200, json={"access_token": "token-1", "expires_in": 300})
            api_calls.append(request)
            return httpx.Response(200, json=[{"busstopId": 1}])

        client = self.make_client(handler)
        first = await client.get_bus_stops()
        second = await client.get_bus_stops()

        self.assertEqual(first, [{"busstopId": 1}])
        self.assertEqual(second, first)
        self.assertEqual(len(token_calls), 1)
        self.assertEqual(len(api_calls), 2)
        self.assertEqual(token_calls[0].content, b"grant_type=client_credentials")
        self.assertTrue(token_calls[0].headers["Authorization"].startswith("Basic "))
        for call in api_calls:
            self.assertEqual(call.headers["Authorization"], "Bearer token-1")
            self.assertEqual(call.url.path, "/api/transportepublico/buses/busstops")

    async def test_missing_credentials_raises_configuration_error(self):
        with (
            patch.dict(
                os.environ,
                {"IMM_CLIENT_ID": "", "IMM_CLIENT_SECRET": ""},
            ),
            self.assertRaises(ImmConfigurationError) as ctx,
        ):
            ImmClient()

        message = str(ctx.exception)
        self.assertIn("IMM_CLIENT_ID", message)
        self.assertIn("IMM_CLIENT_SECRET", message)
        self.assertNotIn(CLIENT_SECRET, message)

    async def test_401_refreshes_token_and_retries_once(self):
        token_calls = []
        api_calls = []
        token_number = 0

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal token_number
            if request.url.path == "/token":
                token_number += 1
                token_calls.append(request)
                return httpx.Response(
                    200, json={"access_token": f"token-{token_number}", "expires_in": 300}
                )
            api_calls.append(request)
            if len(api_calls) == 1:
                return httpx.Response(401, json={"detail": "unauthorized"})
            return httpx.Response(200, json=[])

        client = self.make_client(handler)
        result = await client.get_buses()

        self.assertEqual(result, [])
        self.assertEqual(len(token_calls), 2)
        self.assertEqual(len(api_calls), 2)
        self.assertEqual(api_calls[0].headers["Authorization"], "Bearer token-1")
        self.assertEqual(api_calls[1].headers["Authorization"], "Bearer token-2")

    async def test_429_is_retried(self):
        api_calls = []

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/token":
                return httpx.Response(
                    200, json={"access_token": "token-1", "expires_in": 300}
                )
            api_calls.append(request)
            if len(api_calls) == 1:
                return httpx.Response(429)
            return httpx.Response(200, json=[{"id": "ok"}])

        client = self.make_client(handler)
        result = await client.get_line_variants()

        self.assertEqual(result, [{"id": "ok"}])
        self.assertEqual(len(api_calls), 2)

    async def test_rate_limit_error_after_retries(self):
        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/token":
                return httpx.Response(
                    200, json={"access_token": "token-1", "expires_in": 300}
                )
            return httpx.Response(429)

        client = self.make_client(handler, max_retries=1)
        with self.assertRaises(ImmRateLimitError) as ctx:
            await client.get_bus_stops()

        message = str(ctx.exception)
        self.assertIn("/buses/busstops", message)
        self.assertNotIn(CLIENT_SECRET, message)
        self.assertNotIn("Authorization", message)

    async def test_server_error_after_retries(self):
        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/token":
                return httpx.Response(
                    200, json={"access_token": "token-1", "expires_in": 300}
                )
            return httpx.Response(503)

        client = self.make_client(handler, max_retries=1)
        with self.assertRaises(ImmUpstreamError) as ctx:
            await client.get_bus_stops()

        self.assertIn("503", str(ctx.exception))
        self.assertNotIn(CLIENT_SECRET, str(ctx.exception))

    async def test_timeout_is_wrapped_without_secrets(self):
        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/token":
                return httpx.Response(
                    200, json={"access_token": "token-1", "expires_in": 300}
                )
            raise httpx.TimeoutException("boom")

        client = self.make_client(handler, max_retries=0)
        with self.assertRaises(ImmUpstreamError) as ctx:
            await client.get_bus_stops()

        message = str(ctx.exception)
        self.assertIn("Timeout", message)
        self.assertNotIn(CLIENT_SECRET, message)
        self.assertNotIn("boom", message)

    async def test_rate_limiter_sleeps_when_window_is_exhausted(self):
        sleeps = []

        async def fake_sleep(delay: float) -> None:
            sleeps.append(delay)

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/token":
                return httpx.Response(
                    200, json={"access_token": "token-1", "expires_in": 300}
                )
            return httpx.Response(200, json=[])

        client = self.make_client(handler, rate_limit=1, rate_window=0.05)
        with patch.object(imm_client.asyncio, "sleep", new=fake_sleep):
            for _ in range(3):
                await client.get_bus_stops()

        self.assertTrue(any(delay >= 0.04 for delay in sleeps), sleeps)

    async def test_gtfs_version_and_download(self):
        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/token":
                return httpx.Response(
                    200, json={"access_token": "token-1", "expires_in": 300}
                )
            if request.url.path.endswith("version.txt"):
                return httpx.Response(200, text="20261116\n")
            if request.url.path.endswith("google_transit.zip"):
                return httpx.Response(200, content=b"PK\x03\x04fake")
            return httpx.Response(404)

        client = self.make_client(handler)
        self.assertEqual(await client.get_gtfs_version(), "20261116")
        self.assertEqual(await client.download_gtfs(), b"PK\x03\x04fake")

    async def test_upcoming_buses_requires_lines(self):
        client = self.make_client(lambda request: httpx.Response(200, json=[]))
        with self.assertRaises(ValueError):
            await client.get_upcoming_buses(123, [])

    async def test_get_client_reads_credentials_from_environment(self):
        env = {
            "IMM_CLIENT_ID": "env-client-id",
            "IMM_CLIENT_SECRET": "env-client-secret",
            "IMM_TOKEN_URL": "https://example.test/token",
            "IMM_API_BASE_URL": "https://example.test/api/",
        }
        with patch.dict(os.environ, env):
            client = imm_client.get_client()
        try:
            self.assertEqual(client._client_id, "env-client-id")
            self.assertEqual(client._client_secret, "env-client-secret")
            self.assertEqual(client._token_url, "https://example.test/token")
            self.assertEqual(client._api_base_url, "https://example.test/api")
        finally:
            await client.aclose()

    async def test_token_is_refreshed_after_expiry_skew(self):
        token_number = 0

        def handler(request: httpx.Request) -> httpx.Response:
            nonlocal token_number
            if request.url.path == "/token":
                token_number += 1
                return httpx.Response(
                    200,
                    json={"access_token": f"token-{token_number}", "expires_in": 300},
                )
            return httpx.Response(200, json=[])

        client = self.make_client(handler)
        await client.get_bus_stops()
        now = imm_client.time.monotonic()
        with patch.object(imm_client.time, "monotonic", return_value=now + 300):
            await client.get_bus_stops()

        self.assertEqual(token_number, 2)

    async def test_defaults_follow_imm_limits(self):
        env = {"IMM_CLIENT_ID": CLIENT_ID, "IMM_CLIENT_SECRET": CLIENT_SECRET}
        with patch.dict(os.environ, env):
            client = imm_client.get_client()
        try:
            self.assertEqual(client._rate_limit, imm_client.DEFAULT_RATE_LIMIT)
            self.assertEqual(client._rate_window, imm_client.DEFAULT_RATE_WINDOW)
            self.assertEqual(client._max_retries, 2)
            self.assertEqual(client._token_url, imm_client.DEFAULT_TOKEN_URL)
            self.assertEqual(client._api_base_url, imm_client.DEFAULT_API_BASE_URL)
        finally:
            await client.aclose()

    async def test_operations_build_expected_paths_and_params(self):
        calls = []

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/token":
                return httpx.Response(
                    200, json={"access_token": "token-1", "expires_in": 300}
                )
            calls.append(request)
            return httpx.Response(200, json=[])

        client = self.make_client(handler)
        await client.get_buses(
            company="CUTCSA",
            lines=["1", "2"],
            line_variant_ids=[10, 20],
            bus_id=7,
            bus_stop_id=8,
            response_format="geojson",
        )
        await client.get_bus_stop_lines(123)
        await client.get_upcoming_buses(
            123, ["1", "2"], amount_per_line=3, response_format="geojson"
        )
        await client.get_line_variant("variant-1")

        self.assertEqual(
            [call.url.path for call in calls],
            [
                "/api/transportepublico/buses",
                "/api/transportepublico/buses/busstops/123/lines",
                "/api/transportepublico/buses/busstops/123/upcomingbuses",
                "/api/transportepublico/buses/linevariants/variant-1",
            ],
        )
        self.assertEqual(calls[0].url.params.get_list("lines"), ["1", "2"])
        self.assertEqual(calls[0].url.params.get_list("lineVariantIds"), ["10", "20"])
        self.assertEqual(calls[0].url.params["company"], "CUTCSA")
        self.assertEqual(calls[0].url.params["busId"], "7")
        self.assertEqual(calls[0].url.params["busstopId"], "8")
        self.assertEqual(calls[2].url.params["lines"], "1,2")
        self.assertEqual(calls[2].url.params["amountperline"], "3")
        self.assertEqual(calls[2].url.params["format"], "geojson")


if __name__ == "__main__":
    unittest.main()
