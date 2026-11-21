# Backlog de producto — Ómnibus Tracker

Backlog del MVP Android para planificar viajes en transporte público. El corte inicial se enfoca en la ciudad por defecto, pero la app está diseñada para soportar múltiples ciudades.
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

## Hito principal

Conseguir que un usuario pueda introducir dos direcciones de su ciudad y
obtener alternativas reales de ómnibus, con sus paradas y transbordos. Para
ello, la prioridad es implementar la integración real de transporte:
1. Descargar el GTFS oficial de Montevideo.
2. Analizar `routes.txt`, `trips.txt`, `stops.txt`, `stop_times.txt` y
   `shapes.txt`.
3. Configurar OpenTripPlanner.
4. Implementar geocodificación de origen y destino.
5. Calcular itinerarios reales.
6. Dibujar recorridos y paradas sobre MapLibre.

## Corte MVP sugerido

| Release | Alcance |
| ------- | ------- |
| vNext | Integración real de transporte (BL-001 – BL-008, BL-017) hasta alcanzar el hito principal |
| Next | Calidad, CI y mapas de producción (BL-009 – BL-013) |
| Last | Privacidad/sincronización, mantenimiento de la fuente y adopción (BL-014 – BL-016, BL-018) |

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

### BL-005 · Endpoint de planificación con itinerarios reales · P0
- **What:** Endurecer el endpoint `/v1/trips/plan`: validación de parámetros, timeouts, caché y límites de consulta.
- **Acceptance criteria:**
  - [ ] Validación de entrada robusta (coordenadas, preferencias, hora de salida)
  - [ ] Timeout y manejo de errores hacia el cliente móvil
  - [ ] Caché de resultados cuando aplique
  - [ ] Límites de consulta documentados
- **Depends on:** BL-004
- **Status:** todo

## Épica 2: Experiencia de planificación en móvil

### BL-006 · Geocodificación real del destino (mediada por backend) · P0
- **What:** El adaptador de geocodificación es solo un tipo; Nominatim público no debe invocarse desde el cliente en producción. Implementar geocodificación mediada por backend/proveedor con SLA.
- **Acceptance criteria:**
  - [x] Búsqueda de destino devuelve coordenadas reales (autocomplete origen/destino en home vía `GET /v1/geocode/search`)
  - [x] Geocodificación pasa por backend (Nominatim mediado; sin llamadas directas desde el cliente)
  - [x] Manejo de errores y estados vacíos en la UI (sugerencias, “sin resultados”, backend caído)
  - [ ] Proveedor/SLA de producción y límites documentados (sustituir Nominatim público en prod)
- **Depends on:** BL-005
- **Status:** in-progress

### BL-019 · Mapa interactivo en planificación (autocomplete + ruta preview) · P0
- **What:** Al escribir origen y destino, mostrar sugerencias de lugares y previsualizar en MapLibre marcadores y línea entre ambos puntos (sin geometría OTP inventada).
- **Acceptance criteria:**
  - [x] Autocomplete debounced en origen y destino mientras se escribe
  - [x] MapLibre nativo con marcadores origen/destino y ajuste de cámara
  - [x] Línea de vista previa entre origen y destino geocodificados
  - [x] Misma vista de mapa en pantalla de resultados con coordenadas recibidas
- **Depends on:** BL-006 (parcial)
- **Status:** done

### BL-007 · Aplicar preferencias del usuario al planificador · P0
- **What:** Las preferencias (evitar transbordos, caminar menos, accesibilidad) se guardan pero no se aplican al cálculo. Conectarlas al motor.
- **Acceptance criteria:**
  - [ ] Las preferencias se envían al backend y afectan el resultado
  - [ ] La nota informativa de `preferences.tsx` se elimina cuando esté conectado
  - [ ] Comportamiento verificable con tests
- **Depends on:** BL-005
- **Status:** todo

### BL-008 · Mostrar itinerarios, paradas y transbordos en resultados · P0
- **What:** La pantalla de resultados solo muestra un aviso. Presentar alternativas ordenadas por duración y transbordos, paradas de subida/bajada/intermedias, tiempo de caminata y ETA.
- **Acceptance criteria:**
  - [x] Lista de itinerarios con duración, caminata y transbordos
  - [x] Detalle de paradas y piernas (legs) por itinerario
  - [x] Estados de carga, vacío y error
  - [x] Sin datos inventados si el servicio no está configurado
- **Depends on:** BL-006, BL-007
- **Status:** done

### BL-026 · Usar ubicación GPS como origen por defecto · P0
- **What:** Al abrir la app, el origen debe resolverse automáticamente con la ubicación GPS del usuario en lugar de usar un punto fijo de la ciudad seleccionada. Si no hay permiso o GPS disponible, se usa el centro de la ciudad configurada como fallback.
- **Acceptance criteria:**
  - [x] Al iniciar la app se solicita/obtiene permiso de ubicación y se usa la posición actual como origen.
  - [x] Si el usuario rechaza el permiso o el GPS falla, el origen por defecto es el centro de la ciudad configurada.
  - [x] El usuario puede seguir usando el botón GPS para actualizar manualmente.
  - [x] No se persiste la ubicación actual sin acción explícita del usuario (ver BL-014).
- **Depends on:** BL-006, BL-022
- **Status:** done

### BL-017 · Dibujar recorridos y paradas sobre MapLibre · P0
- **What:** Mostrar sobre el mapa de resultados las rutas (shapes) y paradas de cada itinerario alternativo, con interacción para seleccionar una alternativa.
- **Acceptance criteria:**
  - [ ] Polilíneas de cada leg (shape) dibujadas sobre MapLibre
  - [ ] Marcadores de paradas de subida/bajada e intermedias
  - [ ] Selección de itinerario resalta su recorrido
  - [ ] Sin geometrías inventadas si no hay datos oficiales
- **Depends on:** BL-004, BL-008
- **Status:** todo

## Épica 3: Mapas y tiles en producción

### BL-009 · Proveedor de tiles de producción y atribución · P1
- **What:** El estilo demo de MapLibre solo sirve para desarrollo. Elegir y configurar un proveedor de tiles con plan gratuito adecuado (o infraestructura propia) y revisar atribución/licencia ODbL.
- **Acceptance criteria:**
  - [x] `EXPO_PUBLIC_MAP_STYLE_URL` apunta a un proveedor válido en builds de producción
  - [x] Atribución y licencia documentadas
  - [x] El endpoint demo no se usa en producción
- **Depends on:** —
- **Status:** done

### BL-023 · Mejorar calidad visual de los tiles del mapa · P1
- **What:** El recurso de tiles actual (`demotiles.maplibre.org`) es de muy baja calidad. Reemplazarlo por un proveedor con resolución, contraste y cobertura adecuados para la navegación urbana en Montevideo.
- **Acceptance criteria:**
  - [x] Los tiles muestran calles, nombres y puntos de referencia legibles al zoom de ruta.
  - [x] Se comparan al menos dos proveedores (gratuitos o propios) y se documenta la elección.
  - [ ] La mejora se valida en dispositivo Android bajo luz solar y en interiores.
- **Depends on:** BL-009
- **Status:** done

### BL-024 · Mostrar paradas de la ruta seleccionada en el mapa · P1
- **What:** Al seleccionar un itinerario o ruta, dibujar en el mapa las paradas de subida, bajada e intermedias correspondientes a esa ruta.
- **Acceptance criteria:**
  - [x] Las paradas del itinerario seleccionado se muestran como marcadores sobre MapLibre.
  - [x] Se distinguen visualmente parada de subida, parada de bajada y paradas intermedias.
  - [x] Al cambiar de itinerario alternativo, se actualizan los marcadores.
  - [x] Sin geometrías ni paradas inventadas si no hay datos oficiales.
- **Depends on:** BL-017
- **Status:** done

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

### BL-029 · APK standalone local se queda en blanco en el teléfono · P0
- **What:** La APK generada con `npm run android:apk` es una variante debug de `expo-dev-client` que no embebe el bundle JS. Al instalarla y abrirla sin Metro corriendo la app se queda en blanco. Además hay errores menores que impiden un build limpio: `ALTER TABLE` no idempotente en SQLite y error de tipos en `MapView.native.tsx`.
- **Acceptance criteria:**
  - [x] `npm run android:apk` genera una APK release que embebe el bundle JS y abre sola en el teléfono.
  - [x] `src/db/database.ts` es idempotente: no falla si `city_id` ya existe.
  - [x] `npm run typecheck` y `npm run lint` pasan sin errores.
  - [x] `TESTEAR_APP.md` y/o `README.md` reflejan que la APK local ahora es standalone.
- **Depends on:** BL-010
- **Status:** done

### BL-032 · Dibujar línea de preview de ruta en el mapa nativo · P0
- **What:** Al seleccionar origen y destino en la pantalla principal (o al ver resultados), el mapa nativo muestra los marcadores pero no la línea que une ambos puntos ni ajusta bien la cámara. Agregar una línea de preview y corregir el framing.
- **Acceptance criteria:**
  - [x] `MapView.native.tsx` dibuja una línea entre origen y destino cuando ambos existen.
  - [x] Si hay un itinerario con `shape`, se dibuja la geometría real del recorrido.
  - [x] La cámara se ajusta a los bounds de origen/destino/paradas.
  - [x] `npm run typecheck` y `npm run lint` pasan sin errores.
- **Depends on:** BL-019, BL-029
- **Status:** done

### BL-033 · Mostrar ciudad y país en selector de preferencias · P0
- **What:** El selector de ciudad en `preferences.tsx` muestra "la ciudad por defecto" en lugar del nombre y país de la ciudad configurada.
- **Acceptance criteria:**
  - [x] `src/config/cities.ts` usa `"Montevideo, Uruguay"` como etiqueta de la ciudad por defecto.
  - [x] El selector y la fila de preferencias muestran ciudad y país.
  - [x] `npm run typecheck` y `npm run lint` pasan sin errores.
- **Depends on:** BL-022
- **Status:** done

### BL-034 · Actualizar guía de desarrollo Android a tiles y API key de producción · P2
- **What:** `docs/desarrollo-android-local.md` aún recomienda tiles demo (`demotiles.maplibre.org`) y no menciona `EXPO_PUBLIC_API_KEY`. Actualizar la guía para reflejar la configuración actual de desarrollo.
- **Acceptance criteria:**
  - [x] La guía usa `EXPO_PUBLIC_MAP_STYLE_URL` de CARTO Voyager u otro proveedor de producción.
  - [x] La guía incluye `EXPO_PUBLIC_API_KEY` como variable requerida.
  - [x] Las rutas de APK reflejan la variante release standalone.
- **Depends on:** BL-023, BL-030
- **Status:** done

### BL-035 · Backend falla al iniciar en FastAPI Cloud por ruta de SQLite no escribible · P0
- **What:** `backend/app/db.py` usa `/data/api_keys.db` como default. El contenedor de FastAPI Cloud no tiene permisos para crear `/data`, por lo que `init_db()` lanza `PermissionError` y el servicio no arranca.
- **Acceptance criteria:**
  - [x] `backend/app/db.py` usa una ruta por defecto dentro del proyecto (`/app/data/api_keys.db` o relativa a `backend/`).
  - [x] Se puede sobreescribir vía `API_KEYS_DB_PATH` sin cambios de código.
  - [x] El directorio de datos está ignorado por git.
  - [x] `backend/README.md` refleja el nuevo default.
  - [x] `npm run typecheck` y `npm run lint` del frontend pasan (gates del repo).
- **Depends on:** BL-030
- **Status:** done

### BL-027 · Evaluar opciones de hosting/distribución de la app móvil · P1
- **What:** Documentar alternativas para distribuir la app Android/iOS y recomendar la mejor opción según el stack (Expo/React Native) y presupuesto. El backend usará FastAPI Cloud (https://fastapicloud.com).
- **Acceptance criteria:**
  - [x] Comparativa de opciones móviles: Google Play Store, Apple App Store, Expo Application Services (EAS), Firebase App Distribution, TestFlight, Microsoft App Center, APK directo, FDroid.
  - [x] Recomendación principal justificada (costo, facilidad, OTA updates, CI/CD).
  - [x] Pasos de alto nivel para la opción recomendada documentados en `docs/deployment.md`.
- **Depends on:** —
- **Status:** done

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

### BL-025 · Guardar historial de rutas frecuentes del usuario · P2
- **What:** Permitir guardar las rutas que el usuario busca, mostrarlas como "frecuentes" o "recientes" y permitir reutilizarlas con un toque.
- **Acceptance criteria:**
  - [x] Cada búsqueda de viaje exitosa con origen explícito se guarda en historial local (origen, destino, coordenadas, timestamp).
  - [x] Las búsquedas cuyo origen sea la ubicación GPS actual no se guardan para respetar la privacidad (BL-014/BL-026).
  - [x] El usuario puede ver una lista de rutas frecuentes/recientes.
  - [x] El usuario puede borrar el historial completo o ítems individuales.
  - [ ] Opcional: limitar cantidad de entradas guardadas.
- **Depends on:** BL-008
- **Status:** done

## Épica 6: Configuración y alcance geográfico

### BL-022 · Configuración de ciudad/país por defecto · P1
- **What:** Como parte de la configuración de la app, mostrar el listado de ciudad/país disponibles. Por defecto "la ciudad por defecto". Las búsquedas de direcciones, geocodificación y mapa deben respetar la configuración seleccionada.
- **Acceptance criteria:**
  - [x] Pantalla de preferencias permite seleccionar ciudad/país de una lista configurable.
  - [x] Valor por defecto: "la ciudad por defecto".
  - [x] La geocodificación y el centro del mapa usan la ciudad seleccionada.
  - [x] Si no hay ciudad configurada, se usa Montevideo sin fallar.
- **Depends on:** BL-006
- **Status:** done

## Épica 7: Mantenimiento de la fuente de transporte

### BL-018 · Revisión semanal de actualizaciones del GTFS de la IMM · P1
- **What:** Establecer una revisión semanal de actualizaciones del GTFS publicado por la IMM para mantener actualizada la fuente de transporte (fechas, rutas, paradas).
- **Acceptance criteria:**
  - [ ] Rutina semanal documentada (manual o automatizada) para verificar nueva versión del GTFS
  - [ ] Comparación de versión/fecha del feed y registro del resultado
  - [ ] Procedimiento de revalidación y recarga en OTP documentado
  - [ ] Alerta/notificación cuando haya un feed nuevo
- **Depends on:** BL-003, BL-004
- **Status:** todo

## Épica 8: Seguridad

### BL-030 · Proteger endpoints de la API con API key gestionada desde el backend · P0
- **What:** Los endpoints públicos del backend (`/v1/geocode/search`, `/v1/trips/plan`, etc.) deben requerir una API key válida. El backend debe exponer mecanismos para generar, listar, rotar y revocar esas keys sin modificar código.
- **Acceptance criteria:**
  - [x] Cada petición a endpoints protegidos debe incluir una API key válida (p. ej. header `X-API-Key`).
  - [x] Sin API key o con key inválida/revocada el backend responde `401 Unauthorized`.
  - [x] El backend expone endpoints/admin para crear, listar, rotar y revocar API keys (solo administrador/autenticado).
  - [x] La app móvil carga la API key desde variables de entorno (`EXPO_PUBLIC_API_KEY`) y la envía en cada request.
  - [x] Ninguna API key real se commitea al repositorio.
  - [x] Documentación en `backend/README.md` y `docs/security.md` explica el mecanismo.
- **Depends on:** —
- **Status:** done

## Épica 9: Panel de administración

### BL-031 · Frontend de administración para gestionar API keys, usuarios y analytics · P1
- **What:** Crear un frontend web de administración para gestionar Ómnibus Tracker: API keys, usuarios/administradores, métricas/analytics de uso de la API y estado del sistema.
- **Acceptance criteria:**
  - [ ] Frontend accesible en una ruta/admin separada (p. ej. `/admin`) o proyecto independiente.
  - [ ] Autenticación de administrador antes de acceder al panel.
  - [ ] Pantalla para listar, crear, rotar y revocar API keys consumiendo los endpoints del backend.
  - [ ] Pantalla básica de usuarios/administradores (listado, activar/desactivar).
  - [ ] Dashboard de analytics con métricas de uso de la API (requests, errores, endpoints más usados) cuando el backend las exponga.
  - [ ] No se exponen API keys ni credenciales en el cliente más allá de lo necesario para la sesión autenticada.
  - [ ] Documentación de instalación y despliegue del panel en `docs/admin-dashboard.md`.
- **Depends on:** BL-030
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

### BL-028 · Corregir dependencia de FastAPI para FastAPI Cloud · P0
- **What:** El deploy en FastAPI Cloud falla con `RuntimeError: To use the fastapi command, please install "fastapi[standard]"`. El `requirements.txt` instala `fastapi` sin el extra `[standard]`, que incluye `fastapi-cli` y las dependencias mínimas que el comando `fastapi` necesita.
- **Acceptance criteria:**
  - [x] `backend/requirements.txt` usa `fastapi[standard]`
  - [x] El deploy en FastAPI Cloud arranca sin el RuntimeError (verificar tras push)
  - [x] README/backend documenta el requirement si aplica (usa `requirements.txt`; no requiere cambio)
- **Depends on:** —
- **Status:** done

Las enmiendas a la constitución requieren una entrada `BL-xxx` correspondiente
con justificación documentada; se anexan aquí cuando se propongan.
