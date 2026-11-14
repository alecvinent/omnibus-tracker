# Backlog de producto — Ómnibus Tracker

Backlog del MVP Android para planificar viajes en ómnibus en Montevideo,
derivado de `README.md`, `docs/architecture.md`, `docs/data-sources.md`,
`backend/README.md` y los huecos detectados en el código el 2026-11-14.

**Este backlog es la única fuente de specs.** El **What** y los **Acceptance
criteria** de cada historia son la semilla del spec; el flujo specify los
elabora en specs y tareas completas.

## Workflow

Cada ítem fluye por el pipeline spec-kit, en orden, honrando cada gate:

`backlog item → /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.analyze → /speckit.implement → /speckit.converge`

- Tras `/speckit.tasks`, ejecutar `/speckit.analyze`, resolver todos los
  hallazgos y re-ejecutar hasta quedar limpio — solo entonces
  `/speckit.implement`.
- Cerrar con `/speckit.converge` para anexar el trabajo no construido como
  tareas.
- Tras completar una feature, actualizar los README afectados y la
  documentación (`README.md`, `docs/`) para que reflejen el comportamiento
  entregado — una feature no está completa hasta que la doc coincida.
- **Una épica → una feature spec-kit** (`specs/NNN-<slug>`).
- **Una historia (`BL-xxx`) → un grupo de tareas**; sus criterios de
  aceptación se convierten en requisitos / escenarios de aceptación.
- Los ids `BL-xxx` se arrastran a specs, planes, tareas y mensajes de commit.
- Secuenciar según el corte MVP de abajo.

**Prioridades:** P0 = imprescindible para un MVP confiable · P1 = importante poco después · P2 = deseable
**Valores de estado:** `todo` · `in-progress` · `done`

## Corte MVP sugerido

| Release | Alcance |
| ------- | ------- |
| vNext | Épicas 1–2 (BL-001 – BL-005, BL-006 – BL-008) — integración de datos oficial y planificación real |
| Next | Épicas 3–4 (BL-009 – BL-013) — mapas de producción, calidad y CI |
| Last | Épicas 5–6 (BL-014 – BL-015) — privacidad/sincronización y adopción del workflow |

## Épica 1: Integración de datos (GTFS + OTP en backend)

### BL-001 · Registrar la aplicación en el portal de APIs de la IMM y verificar límites/credenciales · P0
- **What:** Sin registro no hay acceso a la API pública de transporte de la IMM (posiciones, ETA, GTFS). Registrar la app, obtener credenciales y documentar límites/cuotas.
- **Acceptance criteria:**
  - [ ] Aplicación registrada en el portal de APIs de la IMM; credenciales almacenadas solo en el backend (nunca en `EXPO_PUBLIC_*`)
  - [ ] Límites, cuotas y términos de uso documentados en `docs/data-sources.md`
  - [ ] Credenciales rotadas/revocables y fuera del repositorio (`.env` gitignored)
- **Depends on:** —
- **Status:** todo

### BL-002 · Cliente IMM con autenticación en servidor · P0
- **What:** El backend no tiene cliente para la API de la IMM. Implementar un cliente autenticado en servidor con manejo de errores y reintentos.
- **Acceptance criteria:**
  - [ ] Módulo de cliente IMM en `backend/app/` con autenticación por token/credencial de servidor
  - [ ] Manejo de errores HTTP y timeouts; sin credenciales en logs
  - [ ] Tests unitarios del cliente (mock de HTTP) pasan
  - [ ] `ruff check .` y `ruff check --select F` limpios (cuando se adopten)
- **Depends on:** BL-001
- **Status:** todo

### BL-003 · Descarga y validación periódica del GTFS · P0
- **What:** Validar el feed estático GTFS de Montevideo (`/buses/gtfs/static/latest/google_transit.zip`) antes de habilitar el planificador: fechas, `agency.txt`, `routes.txt`, `trips.txt`, `stops.txt`, `stop_times.txt`, `shapes.txt`, calendario y excepciones.
- **Acceptance criteria:**
  - [ ] Job/script de descarga + validación del GTFS documentado y ejecutable
  - [ ] Validaciones de estructura y fechas pasan sobre el feed real
  - [ ] Resultado de validación (versión, fecha) expuesto/registrado
  - [ ] No se inventan líneas, horarios ni paradas
- **Depends on:** BL-001
- **Status:** todo

### BL-004 · Integrar OpenTripPlanner como motor de itinerarios en FastAPI · P0
- **What:** Conectar FastAPI a OpenTripPlanner sobre el GTFS validado + red peatonal OSM, siguiendo el flujo de `docs/architecture.md`.
- **Acceptance criteria:**
  - [ ] OTP configurado con el feed GTFS y datos OSM de red peatonal
  - [ ] FastAPI consulta OTP y normaliza al contrato `PlannedItinerary`
  - [ ] `/v1/trips/plan` deja de responder 503 y devuelve itinerarios reales
  - [ ] Sin rutas ficticias
- **Depends on:** BL-003
- **Status:** todo

### BL-005 · Endpoint de planificación con itinerarios reales · P1
- **What:** Endurecer el endpoint `/v1/trips/plan`: validación de parámetros, timeouts, caché y límites de consulta.
- **Acceptance criteria:**
  - [ ] Validación de entrada robusta (coordenadas, preferencias, hora de salida)
  - [ ] Timeout y manejo de errores hacia el cliente móvil
  - [ ] Caché de resultados cuando aplique
  - [ ] Límites de consulta documentados
- **Depends on:** BL-004
- **Status:** todo

## Épica 2: Experiencia de planificación en móvil

### BL-006 · Geocodificación real del destino (mediada por backend) · P1
- **What:** El adaptador de geocodificación es solo un tipo; Nominatim público no debe invocarse desde el cliente en producción. Implementar geocodificación mediada por backend/proveedor con SLA.
- **Acceptance criteria:**
  - [ ] Búsqueda de destino devuelve coordenadas reales
  - [ ] Geocodificación pasa por backend o proveedor con SLA (no Nominatim directo desde el cliente)
  - [ ] Manejo de errores y estados vacíos en la UI
- **Depends on:** BL-005
- **Status:** todo

### BL-007 · Aplicar preferencias del usuario al planificador · P1
- **What:** Las preferencias (evitar transbordos, caminar menos, accesibilidad) se guardan pero no se aplican al cálculo. Conectarlas al motor.
- **Acceptance criteria:**
  - [ ] Las preferencias se envían al backend y afectan el resultado
  - [ ] La nota informativa de `preferences.tsx` se elimina cuando esté conectado
  - [ ] Comportamiento verificable con tests
- **Depends on:** BL-005
- **Status:** todo

### BL-008 · Mostrar itinerarios, paradas y transbordos en resultados · P1
- **What:** La pantalla de resultados solo muestra un aviso. Presentar alternativas ordenadas por duración y transbordos, paradas de subida/bajada/intermedias, tiempo de caminata y ETA.
- **Acceptance criteria:**
  - [ ] Lista de itinerarios con duración, caminata y transbordos
  - [ ] Detalle de paradas y piernas (legs) por itinerario
  - [ ] Estados de carga, vacío y error
  - [ ] Sin datos inventados si el servicio no está configurado
- **Depends on:** BL-006, BL-007
- **Status:** todo

## Épica 3: Mapas y tiles en producción

### BL-009 · Proveedor de tiles de producción y atribución · P1
- **What:** El estilo demo de MapLibre solo sirve para desarrollo. Elegir y configurar un proveedor de tiles con plan gratuito adecuado (o infraestructura propia) y revisar atribución/licencia ODbL.
- **Acceptance criteria:**
  - [ ] `EXPO_PUBLIC_MAP_STYLE_URL` apunta a un proveedor válido en builds de producción
  - [ ] Atribución y licencia documentadas
  - [ ] El endpoint demo no se usa en producción
- **Depends on:** —
- **Status:** todo

## Épica 4: Calidad y habilitadores de ingeniería

### BL-010 · Typecheck y lint como gate · P1
- **What:** No hay gate de calidad estático. Asegurar `tsc --noEmit` y `expo lint` limpios en cada cambio.
- **Acceptance criteria:**
  - [ ] `npm run typecheck` y `npm run lint` pasan sin errores
  - [x] Documentados en `AGENTS.md` como gates de merge
- **Depends on:** —
- **Status:** in-progress

### BL-011 · Tests unitarios para dominio, db y servicios · P1
- **What:** No existen tests. Agregar cobertura unitaria para modelos, repositorios SQLite y servicios (planificador, ubicación).
- **Acceptance criteria:**
  - [ ] Suite de tests ejecutable (Jest o equivalente compatible con Expo)
  - [ ] Cobertura de repositorios y servicios críticos
  - [ ] Tests en CI
- **Depends on:** BL-010
- **Status:** todo

### BL-012 · Tests de integración con el feed real · P2
- **What:** Validar itinerarios calculados contra el GTFS real y verificar en terreno.
- **Acceptance criteria:**
  - [ ] Tests de integración contra backend + OTP con feed real
  - [ ] Validación en terreno documentada
- **Depends on:** BL-004, BL-011
- **Status:** todo

### BL-013 · Workflow de CI en pull requests · P1
- **What:** No hay `.github/workflows`. Crear CI que corra typecheck, lint y tests en cada PR.
- **Acceptance criteria:**
  - [ ] Workflow ejecuta `npm run typecheck`, `npm run lint` y tests en PRs a `develop`
  - [ ] Backend: install deps + tests (pytest cuando existan)
  - [ ] Checks rojo/verde visibles antes del merge
- **Depends on:** BL-010, BL-011
- **Status:** todo

## Épica 5: Privacidad y sincronización

### BL-014 · Revisión de privacidad: no persistir ubicación actual salvo acción explícita · P2
- **What:** Verificar que las coordenadas de ubicación actual no se persistan salvo acción explícita del usuario (guardar lugar), según `docs/architecture.md`.
- **Acceptance criteria:**
  - [x] Auditoría de código confirma que no se persiste ubicación actual automáticamente
  - [x] Documentado en `README.md`/docs
- **Depends on:** —
- **Status:** done

### BL-015 · Usuario anónimo y sincronización remota (fase posterior) · P2
- **What:** Fase posterior: usuario anónimo y sincronización remota con conflicto resuelto por `updated_at`, sin login para el MVP.
- **Acceptance criteria:**
  - [ ] Diseño de sincronización documentado (conflicto por `updated_at`)
  - [ ] Implementación fuera del MVP (no bloquea vNext)
- **Depends on:** —
- **Status:** todo

## Gobernanza

### BL-016 · Adoptar el workflow de backlog · P0
- **What:** Introducir `docs/backlog.md` como única fuente de specs, documentar el pipeline y el modelo de entrega en `AGENTS.md`, y apuntar `CLAUDE.md` al workflow.
- **Acceptance criteria:**
  - [x] `docs/backlog.md` existe con cabecera de workflow, prioridades, corte MVP y épicas sembradas
  - [x] `AGENTS.md` documenta el pipeline, el modelo de entrega y los gates de merge
  - [x] `CLAUDE.md` apunta al workflow de backlog sin alterar bloques existentes
- **Depends on:** —
- **Status:** done

Las enmiendas a la constitución requieren una entrada `BL-xxx` correspondiente
con justificación documentada; se anexan aquí cuando se propongan.
