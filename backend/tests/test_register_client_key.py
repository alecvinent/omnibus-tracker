"""Tests de POST /register/client-key (BL-037: registro de keys de cliente)."""

from __future__ import annotations

import os
import unittest
from unittest.mock import patch

BACKEND_DIR = __import__("pathlib").Path(__file__).resolve().parents[1]
import sys

sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("ADMIN_API_KEY", "test-admin-key")

from app import auth as auth_module
from app import db as db_module
from tests.test_api_key_rotation import ApiKeyRotationTestCase


class RegisterClientKeyTests(ApiKeyRotationTestCase):
    def test_register_with_admin_returns_key_and_name(self):
        resp = self.client.post(
            "/register/client-key",
            headers=self._admin_headers(),
            json={"name": "app-produccion", "deviceId": "M1904F"},
        )
        self.assertEqual(resp.status_code, 200, resp.text)
        data = resp.json()
        self.assertTrue(data["key"].startswith("omni_"))
        self.assertEqual(data["name"], "app-produccion")
        self.assertTrue(data["id"])
        self.assertTrue(db_module.is_valid_api_key(data["key"]))
        rows = db_module.list_api_keys(active_only=False)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["name"], "app-produccion")

    def test_register_default_name_uses_device_id(self):
        resp = self.client.post(
            "/register/client-key",
            headers=self._admin_headers(),
            json={"deviceId": "M1904F"},
        )
        self.assertEqual(resp.status_code, 200, resp.text)
        self.assertEqual(resp.json()["name"], "M1904F")

    def test_register_without_admin_key_returns_503(self):
        with patch.object(auth_module, "ADMIN_API_KEY", None):
            resp = self.client.post("/register/client-key", json={"name": "x"})
        self.assertEqual(resp.status_code, 503)


if __name__ == "__main__":
    unittest.main()
