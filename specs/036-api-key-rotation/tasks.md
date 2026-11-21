# Tasks: BL-036 · Rotación de API keys (endpoint + script CLI)

- [x] T001: `backend/app/db.py` — añadir `rotate_api_key(old_id)` y `create_api_key_with_id(name, key_id)`.
- [x] T002: `backend/app/main.py` — añadir `POST /admin/api-keys/{key_id}/rotate` (404 si no existe/revocada).
- [x] T003: `backend/scripts/generate_api_key.py` — script de generación local.
- [x] T004: `backend/tests/test_api_key_rotation.py` — tests del endpoint de rotación.
- [x] T005: tests del script de generación (fixture temporal de DB).
- [x] T006: `docs/security.md` + `backend/README.md` — documentar endpoint y script.
- [x] T007: gates — pytest backend verde; smoke manual del endpoint y del script; ruff si configurado.
- [x] T008: git — commit en feature branch y PR a `develop` (si se aplica).
