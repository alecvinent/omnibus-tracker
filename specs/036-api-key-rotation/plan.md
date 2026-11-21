# Implementation Plan: Rotación de API keys (endpoint + script CLI)

**Spec**: `specs/036-api-key-rotation/spec.md` · **Status**: Done

## Logic Flow

1. **T001**: Backend — DB: añadir `rotate_api_key(old_id) -> ApiKeyInfo` y `create_api_key_with_id(name, key_id)` en `backend/app/db.py`.
2. **T002**: Backend — Endpoint: `POST /admin/api-keys/{key_id}/rotate` en `backend/app/main.py` (404 si id inexistente/revocada; llama a `rotate_api_key`).
3. **T003**: Backend — Script: `backend/scripts/generate_api_key.py` (arg `--name`, `--output`; inserta key en SQLite; muestra plain una vez por stdout).
4. **T004**: Tests — `backend/tests/test_api_key_rotation.py`: endpoint rotate (200 rotado+activo, 404 inexistente, 404 revocada, rotación repetida, nueva key funciona en verificación).
5. **T005**: Tests — Script: genera key con `--name`, se inserta en DB temporal y se valida contra hash.
6. **T006**: Docs — actualizar `docs/security.md` (endpoint + script) y `backend/README.md` (script + endpoint).
7. **T007**: Gates — verificar `pytest` backend verde, `ruff check .` limpio (si existe config), ejecutar manualmente endpoint y script.
8. **T008**: Git — commit (`feat(backend): BL-036 - endpoint de rotación de API keys`).

## Verification Flow

- Correr `pytest backend/tests -k rotation` → verde.
- Correr `POST /admin/api-keys/{id}/rotate` con curl + ADMIN_API_KEY → rota, valida que la key nueva responde 200 en `/v1/geocode/search` (con mock o httpx) y la vieja 401.
- Correr `python backend/scripts/generate_api_key.py --name test --output /tmp/rot` → se inserta en `backend/data/api_keys.db`; hash válido vía `is_valid_api_key`.
- `ruff check backend/` (si config) limpio.
