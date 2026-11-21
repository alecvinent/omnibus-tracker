# Tasks: BL-037 · Registro de API keys por cliente (app)

- [x] T001: Backend — endpoint `POST /register/client-key` en `main.py`.
- [x] T002: Backend — tests `backend/tests/test_register_client_key.py`.
- [x] T003: App — tabla `client_key` en `src/db/database.ts`.
- [x] T004: App — `src/services/api-key.ts` (register/get/rotate/ensure).
- [x] T005: App — geocoding: `X-API-Key` dinámico.
- [x] T006: App — planner: `X-API-Key` dinámico.
- [x] T007: App — registro en `app/index.tsx` al arrancar.
- [x] T008: App — tests `src/services/api-key.test.ts` + mocks `jest.setup.ts`.
- [x] T009: Docs — security.md + backend/README.md.
- [x] T010: Gates — jest app verde, backend tests verdes, typecheck/lint.
- [x] T011: Git — commits backend + app (feat con BL-037).
