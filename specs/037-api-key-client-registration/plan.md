# Implementation Plan: Registro de API keys por cliente (app)

**Spec**: `specs/037-api-key-client-registration/spec.md` · **Status**: Done

## Logic Flow

1. **T001**: Backend — `main.py`: endpoint `POST /register/client-key` (admin-only) → `create_api_key(clientName)` → responder `{id, name, key, created_at}`. Default: `Omnibus Tracker - {deviceId}` si name/deviceId no entregados.
2. **T002**: Backend — tests `backend/tests/test_register_client_key.py`: 200 + campos, nombre registrado, 503 sin ADMIN_API_KEY, hash válido.
3. **T003**: App — `src/db/database.ts`: tabla `client_key` (key, key_id, name, installed_at).
4. **T004**: App — `src/services/api-key.ts`: `registerClientKey()`, `getClientApiKey()`, `getClientKeyId()`, `rotateClientKey()`, `ensureClientKey()`.
5. **T005**: App — `src/services/geocoding.ts`: headers dinámicos desde `getClientApiKey()`.
6. **T006**: App — `src/services/planner.ts`: headers dinámicos desde `getClientApiKey()`.
7. **T007**: App — `app/index.tsx`: `ensureClientKey().catch(...)` al arrancar.
8. **T008**: App — tests `src/services/api-key.test.ts` (jest) + ajuste `jest.setup.ts` (mocks: expo-sqlite + expo-device).
9. **T009**: Docs — `docs/security.md` (register/client-key + rotación desde cliente), `backend/README.md` (endpoint).
10. **T010**: Gates — jest app (`npx jest src/services/api-key.test.ts`), backend tests, typecheck/lint repo.
11. **T011**: Git — commits `feat(backend): BL-037 ...` + `feat(app): BL-037 ...` en feature branch.
