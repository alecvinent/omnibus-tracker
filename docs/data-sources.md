# Fuentes de datos

## API de transporte público de la IMM (fuente principal)

- Portal: https://api.montevideo.gub.uy
- Registro (cuenta gratuita): https://api.montevideo.gub.uy/signup
- Login: https://api.montevideo.gub.uy/login
- Documentación: https://api.montevideo.gub.uy/apidocs/publictransport
- Especificación Swagger 2.0: https://api.montevideo.gub.uy/swagger/spec/publictransport.json
- Base path: `/api/transportepublico` (`host: api.montevideo.gub.uy`, HTTPS)
- Contacto: `pci@imm.gub.uy`
- Términos: https://ckan.montevideo.gub.uy/im/docs/Terminos%20y%20condiciones%20de%20uso%20-%20Portal%20Datos%20Abiertos%20IM.pdf

La API expone posiciones de buses en tiempo real y ETA; son los servicios que usa la app "Cómo Ir". El servicio es gratuito pero **requiere registrarse con una cuenta gratuita** en el portal.

### Autenticación

OAuth2 con flujo `client_credentials` (`"flow": "application"` en el Swagger):

- Token URL: `https://mvdapi-auth.montevideo.gub.uy/token`
- Credenciales: `client_id` y `client_secret` obtenidos al registrar la aplicación.
- El portal también ofrece login con **ID Uruguay** para la cuenta del desarrollador; eso es distinto de las credenciales de la aplicación.

Las credenciales deben vivir **solo en el backend**, nunca en el bundle móvil ni en variables `EXPO_PUBLIC_*`. Variables sugeridas: `IMM_CLIENT_ID`, `IMM_CLIENT_SECRET`, `IMM_TOKEN_URL` y `IMM_API_BASE_URL` (ver `backend/README.md`).

### Límites y condiciones de uso

- Límite: **10 llamadas por minuto**.
- El propio portal indica que no está pensada para uso directo desde apps públicas, sino invocada desde el backend de cada app, por razones operativas y de seguridad.
- El backend debe soportar el flujo de pedidos de los usuarios y almacenar IDs/tokens en el servidor.
- Por el límite, las consultas deben agregarse/cacharse en backend (BL-002, BL-005). No se debe consultar la API desde el cliente móvil.

### Endpoints

| Endpoint | Descripción |
| --- | --- |
| `GET /buses` | Posiciones de vehículos en tiempo real. Filtros: `company`, `lineVariantIds`, `busId`, `busstopId`, `lines`, `format=geojson`. |
| `GET /buses/busstops` | Listado de paradas (`busstopId`, calles, `location`). |
| `GET /buses/busstops/{busstopId}/lines` | Líneas que pasan por una parada. |
| `GET /buses/busstops/{busstopId}/upcomingbuses` | Buses próximos a llegar; requiere `lines`, acepta `amountperline` y `format=geojson`. |
| `GET /buses/linevariants` | Variantes de línea. |
| `GET /buses/linevariants/{lineVariantId}` | Detalle de una variante. |
| `GET /buses/geo` | Eliminado/deprecated: no usar. |
| `GET /buses/gtfs/static/latest/version.txt` | Versión de la generación actual del GTFS. |
| `GET /buses/gtfs/static/latest/google_transit.zip` | GTFS estático de la IMM. |

Nota: en el Swagger, `GET /buses` no declara `security`, pero las condiciones de uso exigen cuenta gratuita; el cliente debe autenticarse de todas formas.

## GTFS

La IMM publica el feed estático en:

- `GET https://api.montevideo.gub.uy/api/transportepublico/buses/gtfs/static/latest/google_transit.zip`
- `GET https://api.montevideo.gub.uy/api/transportepublico/buses/gtfs/static/latest/version.txt`

Antes de habilitar el planificador hay que validar fechas, `agency.txt`, `routes.txt`, `trips.txt`, `stops.txt`, `stop_times.txt`, `shapes.txt`, calendario y excepciones (BL-003). No se inventan líneas, horarios ni paradas.

### Referencia complementaria: catálogo abierto del MTOP

Además del feed de la IMM, `https://catalogodatos.gub.uy` publica un GTFS metropolitano del Ministerio de Transporte y Obras Públicas (DNT), sin credenciales:

- Dataset: `ministerio-de-transporte-y-obras-publicas-horarios-de-omnibus-en-lineas-interdepartamentales`
- Recurso: `Horarios Metropolitanos GTFS` (`gtfs_20260921.zip`, actualizado 2026-09-21, ~2,7 MB)
- URL directa: https://catalogodatos.gub.uy/dataset/1d50ccf7-121d-48a7-951e-28a02858d24e/resource/9f44b654-751a-42a4-a481-af91b7c9a2e4/download/gtfs_20260921.zip
- Licencia: `Licencia de DAG de Uruguay` (ODbL Uruguay)
- Validado localmente: 8 agencias (CASANOVA, CITA, COETC, COPSA, CUTCSA, COME, TALA-PANDO-MONTEVIDEO, UCOT), 378 rutas, 7.561 viajes, 7.188 paradas, 795.184 registros de `stop_times`, calendario 2026-03-02 a 2026-12-25. No incluye `shapes.txt`, `feed_info.txt` ni `calendar_dates.txt`.

Se registra como fuente de contraste/diagnóstico, no como reemplazo de la API IMM. Ver BL-003 para la validación del feed que finalmente alimente OTP.

### Otros datasets abiertos (STM/IMM)

El catálogo también publica horarios teóricos y datos de recarga del STM bajo la misma licencia, útiles como referencia:

- Horarios urbanos por parada: https://datos-abiertos.montevideo.gub.uy/uptu_pasada_variante.zip (actualización diaria)
- Horarios por puntos de control: https://datos-abiertos.montevideo.gub.uy/HORARIOS_OMNIBUS%20datos.zip (actualización diaria)
- Locales de recarga del STM: dataset `Locales de recarga del STM` en `catalogodatos.gub.uy` (ZIP/TXT)

## OpenStreetMap

Usar datos OSM para red peatonal y cartografía. Respetar ODbL y atribución.

## MapLibre

MapLibre es el renderer, no el proveedor de mapas. La aplicación necesita un `style.json` y fuentes/tiles. El endpoint demo incluido es solo para desarrollo; para producción contratar/autoalojar un proveedor compatible. Ver `docs/deployment.md`.
