# Arquitectura y límites del MVP

## Capas

- `app/`: navegación y pantallas.
- `src/domain/`: modelos de negocio independientes de Expo.
- `src/db/`: persistencia local SQLite.
- `src/services/`: adaptadores de ubicación, geocodificación y planificación.
- `backend/`: integración segura con la API de la IMM (OAuth2 en servidor, caché por límite de 10 llamadas/minuto) y motor OTP sobre el GTFS de la IMM.

## Flujo esperado de planificación

1. Resolver origen y destino a coordenadas.
2. Consultar FastAPI.
3. FastAPI valida parámetros y consulta OpenTripPlanner.
4. OTP calcula itinerarios sobre GTFS + red peatonal OSM.
5. FastAPI normaliza el resultado al contrato `PlannedItinerary`.
6. La app presenta etapas, paradas, caminatas y transbordos.

## Sincronización

SQLite es la fuente local inmediata. La siguiente fase puede agregar un usuario anónimo y sincronización remota con conflicto resuelto por `updated_at`. No se requiere login para el MVP.

## Privacidad

Solicitar ubicación solo al pedir usar GPS. No persistir coordenadas de ubicación actual salvo acción explícita del usuario para guardar un lugar.
