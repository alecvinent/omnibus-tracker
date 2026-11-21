# Tasks: BL-002 · Cliente IMM en servidor

**Input**: `specs/002-imm-client/plan.md`

**Branch**: `feature/002-imm-client`

## Phase 1: Implementación

- [x] T001 Crear `backend/app/imm_client.py` con configuración, factory y excepciones.
- [x] T002 Implementar obtención/cacheo de token OAuth2 con lock y margen de expiración.
- [x] T003 Implementar rate limiter deslizante (10/min) y reintentos con backoff.
- [x] T004 Implementar métodos de buses, paradas, variantes, ETA y GTFS.

## Phase 2: Tests

- [x] T005 Crear `backend/tests/test_imm_client.py` con `httpx.MockTransport`.
- [x] T006 Cubrir: token cacheado, 401 con refresh, 429/5xx con reintento, timeout, configuración faltante, sin secretos en errores.
- [x] T007 Ejecutar tests backend en verde: 10/10.

## Phase 3: Documentación y gates

- [x] T008 Documentar uso y variables en `backend/README.md`.
- [ ] T009 Marcar BL-002 `done` en `docs/backlog.md` tras merge.
- [ ] T010 Gates: `npm run typecheck`, `npm run lint`, `npm run test`, tests backend y `ruff` si está disponible.
- [ ] T011 Commit, merge a `develop`, push y borrado de rama.

## Analyze (pre-implementación)

- Deriva de BL-001: usa las mismas variables de entorno y URLs verificadas.
- No solapa BL-003 (validación GTFS) ni BL-005 (endpoints/caché de alto nivel): este módulo es la capa de transporte.
- Sin secretos en tests: se usan valores ficticios.
