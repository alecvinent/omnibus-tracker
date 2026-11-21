"""Tests de rotación de API keys: endpoint POST /admin/api-keys/{id}/rotate
y script backend/scripts/generate_api_key.py.

Ejecutar desde `backend/`:
    python -m unittest tests.test_api_key_rotation -v
"""

from __future__ import annotations

import os
import sys
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("ADMIN_API_KEY", "test-admin-key")

from fastapi.testclient import TestClient

from app import db as db_module
from app import main as main_module
from scripts import generate_api_key


class ApiKeyRotationTestCase(unittest.TestCase):
    """DB temporal para aíslar pruebas de la base real."""

    def setUp(self) -> None:
        self._tmp = TemporaryDirectory()
        self._old_db_path = db_module.DB_PATH
        db_module.DB_PATH = Path(self._tmp.name) / "keys.db"
        db_module.init_db()
        self.client = TestClient(main_module.app)

    def tearDown(self) -> None:
        db_module.DB_PATH = self._old_db_path
        try:
            self._tmp.cleanup()
        except OSError:
            pass

    def _admin_headers(self) -> dict[str, str]:
        return {"X-Admin-Key": os.environ["ADMIN_API_KEY"]}


class RotateEndpointTests(ApiKeyRotationTestCase):
    def test_rotate_valid_key_revokes_old_and_activates_new(self):
        key_id, plain_key = db_module.create_api_key("app-produccion")

        resp = self.client.post(f"/admin/api-keys/{key_id}/rotate", headers=self._admin_headers())

        self.assertEqual(resp.status_code, 200, resp.text)
        data = resp.json()
        self.assertNotEqual(data["id"], key_id)
        self.assertEqual(data["name"], "app-produccion")
        self.assertTrue(data["key"].startswith("omni_"))
        self.assertNotEqual(data["key"], plain_key)
        self.assertEqual(data["rotated_from"], {"id": key_id})
        # La nueva key es válida y la rotada no lo es
        self.assertTrue(db_module.is_valid_api_key(data["key"]))
        self.assertFalse(db_module.is_valid_api_key(plain_key))

    def test_rotate_nonexistent_id_returns_404(self):
        resp = self.client.post("/admin/api-keys/nope/rotate", headers=self._admin_headers())
        self.assertEqual(resp.status_code, 404)

    def test_rotate_revoked_id_returns_404(self):
        key_id, _plain = db_module.create_api_key("old")
        db_module.revoke_api_key(key_id)
        resp = self.client.post(f"/admin/api-keys/{key_id}/rotate", headers=self._admin_headers())
        self.assertEqual(resp.status_code, 404)

    def test_rotate_twice_invalidates_first_rotation(self):
        key_id, _first_plain = db_module.create_api_key("app")
        first = self.client.post(
            f"/admin/api-keys/{key_id}/rotate", headers=self._admin_headers()
        ).json()
        second = self.client.post(
            f"/admin/api-keys/{first['id']}/rotate", headers=self._admin_headers()
        )
        self.assertEqual(second.status_code, 200)
        # El primer id rotado ya no funciona; la segunda rotación funciona.
        self.assertFalse(db_module.is_valid_api_key(first["key"]))
        self.assertTrue(db_module.is_valid_api_key(second.json()["key"]))
        # La fila de la rotada primera está revocada
        row = db_module.get_api_key(first["id"])
        self.assertIsNotNone(row)
        self.assertIsNotNone(row["revoked_at"])

    def test_rotate_requires_admin(self):
        key_id, _plain = db_module.create_api_key("app")
        resp = self.client.post(f"/admin/api-keys/{key_id}/rotate")
        self.assertEqual(resp.status_code, 403)

    def test_rotated_key_is_usable_in_protected_endpoint(self):
        key_id, _plain = db_module.create_api_key("app")
        data = self.client.post(
            f"/admin/api-keys/{key_id}/rotate", headers=self._admin_headers()
        ).json()

        resp = self.client.get(
            "/v1/geocode/search",
            params={"q": "montevideo", "limit": 1},
            headers={"X-API-Key": data["key"]},
        )
        # El key es válido; la búsqueda puede fallar por servicio externo
        # (502) pero el auth debe aprobarse (no 401/403).
        self.assertNotIn(resp.status_code, (401, 403))

        old_resp = self.client.get(
            "/v1/geocode/search",
            params={"q": "montevideo", "limit": 1},
            headers={"X-API-Key": _plain},
        )
        self.assertEqual(old_resp.status_code, 401)


class GenerateScriptTests(ApiKeyRotationTestCase):
    def test_script_generates_and_saves_key_to_db(self):
        buf = StringIO()
        with patch.object(sys, "argv", ["generate_api_key.py", "--name", "cli-test"]), redirect_stdout(buf):
            rc = generate_api_key.main()

        self.assertEqual(rc, 0)
        key = buf.getvalue().strip()
        self.assertTrue(key.startswith("omni_"))
        self.assertTrue(db_module.is_valid_api_key(key))
        rows = db_module.list_api_keys(active_only=False)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["name"], "cli-test")
        self.assertIsNone(rows[0]["revoked_at"])

    def test_script_rejects_empty_name(self):
        with patch.object(sys, "argv", ["generate_api_key.py", "--name", "   "]), self.assertRaises(SystemExit):
            generate_api_key.main()

    def test_script_respects_api_keys_db_path_env(self):
        with TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            db_file = Path(tmp) / "env.db"
            with patch.dict(os.environ, {"API_KEYS_DB_PATH": str(db_file)}):
                buf = StringIO()
                with patch.object(sys, "argv", ["generate_api_key.py", "--name", "env-test"]), redirect_stdout(buf):
                    rc = generate_api_key.main()
            self.assertEqual(rc, 0)
            self.assertTrue(db_file.exists())
            key = buf.getvalue().strip()
            # Validar contra el DB del entorno
            with patch.dict(os.environ, {"API_KEYS_DB_PATH": str(db_file)}):
                db_module.DB_PATH = db_file
                db_module.init_db()
                self.assertTrue(db_module.is_valid_api_key(key))
                db_module.DB_PATH = self._old_db_path


if __name__ == "__main__":
    unittest.main()
