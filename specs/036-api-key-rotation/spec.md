# Feature Specification: Rotación de API keys (endpoint + script CLI)

**Feature Branch**: `036-api-key-rotation`

**Created**: 2026-11-21

**Status**: Done

**Input**: User description: "backlog: backend generar api key → Agregar endpoint/script de rotación. Generar una nueva API key en un solo paso, revocar la anterior, sin intervención manual en dos requests."

## User Scenarios & Testing

### User Story 1 - Rotar una key por admin (Priority: P1)

Un administrador puede rotar una API key en una sola petición: recibe una nueva key activa y la key rotada deja de funcionar de inmediato.

**Independent Test**: Crear una key (BL-030), rotarla via `POST /admin/api-keys/{id}/rotate`, verificar que la nueva key funciona en `/v1/geocode/search` y la vieja responde 401.

**Acceptance Scenarios**:

1. **Given** admin autenticado, **When** se rota una key válida, **Then** responde el id y el valor una sola vez de la nueva key, nombre heredado y la vieja queda revocada.
2. **Given** admin autenticado, **When** se lista keys (`active_only=true`), **Then** la rotada aparece revocada, la nueva activa.
3. **Given** rotar una key con id inexistente, **Then** responde 404.
4. **Given** rotar una key ya revocada, **Then** responde 404.

### User Story 2 - Generar key local sin servidor (Priority: P1)

Operador puede generar una API key contra el SQLite local (mismos formatos y reglas de hashing) sin levantar el backend.

**Independent Test**: Ejecutar el script con `--name`, verificar la key devuelta está en la DB y que hash la valida (via endpoint `is_valid_api_key`).

**Acceptance Scenarios**:

1. **Given** `API_KEYS_DB_PATH` establecido o default, **When** se ejecuta el script con `--name foo`, **Then** inserta la key y muestra por stdout el valor plain una sola vez.
2. **Given** el DB no existe, **Then** se crea (mkdir parents + tabla).
3. **Given** ejecutar sin args, **Then** error claro (usage) con código de salida no cero.

### Edge Cases

- Rotar múltiples veces la misma key: cada rotación genera una nueva key y la rotada resultante queda revocada.
- Script re-ejecutado: genera keys distintas, ambas válidas (por diseño, no hay idempotencia).
- Rotación cuando `ADMIN_API_KEY` no está configurado: blocked por `verify_admin_key` existente (503).
- La nueva key rotada NO puede tener hash collision: `key_hash` UNIQUE — se reintenta con nuevo token.

## Requirements

### Functional Requirements

- **FR-001**: El backend DEBE exponer `POST /admin/api-keys/{id}/rotate` (admin-only) que, en una petición:
  1. Verifica `id` existe y está activa → si no, 404.
  2. Genera una nueva key (`create_api_key` con el nombre de la rotada).
  3. Revoca la anterior.
  4. Responde con la nueva key (plain, una sola vez) + metadata.
- **FR-002**: El script `backend/scripts/generate_api_key.py` DEBE insertar una key nueva en el SQLite de API keys usando la misma generación/hash que el backend, y mostrar el valor plain una sola vez por stdout.
- **FR-003**: El script DEBE usar `API_KEYS_DB_PATH` env o default (`backend/data/api_keys.db`), creando directorios/tabla si faltan.

### Key Entities

- **ApiKey**: id, name, key_hash, created_at, revoked_at (existente).
- **Rotation response**: id (nueva), name, key (plain), created_at, rotated_from (id de la rotada + revoked_at).

### Implementation Notes

- `db.py`: añadir `rotate_api_key(old_id) -> tuple[ApiKeyInfo, plain_key]` — revoca el id antiguo y devuelve el nuevo registro creado (sin plain key).
- Endpoint en `main.py`: `@app.post("/admin/api-keys/{key_id}/rotate")` — 404 si no existe/revocada; llama a `rotate_api_key`.
- Script: `backend/scripts/generate_api_key.py` — usa `app.db.create_api_key_with_id` (nueva función sqlite que acepta id) para permitir id deterministico.

## Success Criteria

- **SC-001**: `POST /admin/api-keys/{id}/rotate` con admin: nueva key works en `/v1/geocode/search`, key vieja → 401.
- **SC-002**: Rotación de id inexistente/revocada → 404.
- **SC-003**: Script: key generada insertada en DB; se valida con el mismo hash.
- **SC-004**: Tests unitarios pasan (DB temporal, fixtures).
- **SC-005**: `docs/security.md` y `backend/README.md` reflejan rotación + script.
- **SC-006**: `npm run typecheck` y `npm run lint` del frontend pasan (gates del repo).

## Assumptions

- Se reutiliza la generación de keys de BL-030 (`secrets.token_urlsafe`, formato `omni_...`).
- `db.py` usa `DB_PATH` ya existente.
- Tests corren contra SQLite temporal en `tmp_path`.
