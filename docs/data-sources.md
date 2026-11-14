# Fuentes de datos

## IMM

Documentación: https://api.montevideo.gub.uy/apidocs/publictransport

La API publica posiciones de buses, ETA y datos GTFS. Requiere registro en el portal. Las credenciales deben usarse exclusivamente desde backend.

## GTFS

La documentación de la IMM describe el feed estático:
`/buses/gtfs/static/latest/google_transit.zip`

Validar fechas, `agency.txt`, `routes.txt`, `trips.txt`, `stops.txt`, `stop_times.txt`, `shapes.txt`, calendario y excepciones antes de habilitar el planificador.

## OpenStreetMap

Usar datos OSM para red peatonal y cartografía. Respetar ODbL y atribución.

## MapLibre

MapLibre es el renderer, no el proveedor de mapas. La aplicación necesita un `style.json` y fuentes/tiles. El endpoint demo incluido es solo para desarrollo; para producción contratar/autoalojar un proveedor compatible.
