# Tasks: Registrar en portal APIs IMM (BL-001)

**Input**: `specs/001-imm-registration/spec.md`

**Branch**: `feature/001-imm-registration`

## Phase 1: Investigación de la fuente (completada)

- [x] T001 Verificar que el portal `https://api.montevideo.gub.uy/apidocs/publictransport` existe y exige cuenta gratuita.
- [x] T002 Obtener el Swagger de `https://api.montevideo.gub.uy/swagger/spec/publictransport.json`: base path `/api/transportepublico`, OAuth2 `client_credentials`, token URL `https://mvdapi-auth.montevideo.gub.uy/token`.
- [x] T003 Confirmar el límite de 10 llamadas/minuto y la recomendación de invocar desde backend.
- [x] T004 Identificar endpoints de posiciones, ETA, paradas, variantes y GTFS estático.

## Phase 2: Registro manual (usuario, pendiente)

- [ ] T005 Crear cuenta en `https://api.montevideo.gub.uy/signup` (o autenticarse con ID Uruguay).
- [ ] T006 Registrar la aplicación "Ómnibus Tracker" y obtener `client_id` y `client_secret`.
- [ ] T007 Verificar scopes/permisos asignados y guardar credenciales solo en el entorno del backend.

## Phase 3: Configuración y documentación en el repo

- [x] T008 Crear `backend/.env.example` con `IMM_CLIENT_ID`, `IMM_CLIENT_SECRET`, `IMM_TOKEN_URL` e `IMM_API_BASE_URL` usando **placeholders** (nunca valores reales).
- [x] T009 Actualizar `backend/README.md` con instrucciones de registro, obtención de credenciales y variables de entorno.
- [x] T010 Actualizar `docs/data-sources.md` con URLs, auth, endpoints, límite, términos y contacto de la API IMM.
- [x] T011 Actualizar `README.md`, `docs/deployment.md`, `docs/architecture.md` y `docs/desarrollo-android-local.md` para reflejar el uso de la API IMM y el consumo mediado por backend.
- [x] T012 Corregir los criteria de BL-001 en `docs/backlog.md`: desmarcar los ítems manuales hasta que el registro esté completo; mantener `Status: in-progress`.

## Phase 4: Gates y cierre

- [x] T013 Gates ejecutados: `npm run typecheck` limpio, `npm run lint` 0 errores (2 warnings preexistentes), `npm run test` 18/18, tests backend `python -m unittest discover -s backend/tests -t backend` 12/12.
- [ ] T014 Commit y merge a `develop`, push y borrado de la rama.
- [ ] T015 Marcar BL-001 como `done` en `docs/backlog.md` **solo cuando el usuario complete T005–T007** y se confirme el consumo real con credenciales. Hasta entonces BL-001 permanece `in-progress`.

## Dependencies & Execution Order

- T005–T007 son manuales y bloquean el consumo real de la API, pero **no** bloquean la documentación ni la configuración (T008–T012).
- T013 depende de la documentación; T014 depende de T013; T015 depende de T014.
- No agregar credenciales reales al repositorio en ningún paso.
