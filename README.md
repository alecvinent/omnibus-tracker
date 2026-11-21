# Ómnibus Tracker

MVP Android para planificar viajes en transporte público. Por defecto se configura con la ciudad por defecto, pero la arquitectura soporta múltiples ciudades.

## Estado de esta entrega

Incluye:
- Expo + React Native + TypeScript + Expo Router.
- Integración nativa de MapLibre (requiere development build; no funciona en Expo Go).
- Mapa centrado inicialmente en la ciudad configurada (la ciudad por defecto).
- Búsqueda de origen/destino como primera interfaz.
- Solicitud de ubicación del dispositivo.
- Persistencia SQLite para lugares y preferencias.
- Contratos y servicios desacoplados para planificación y datos de transporte.
- Backend FastAPI inicial con health-check y contrato de planificación.

Todavía no incluye cálculo real de itinerarios ni feed GTFS integrado. La API de transporte de la IMM requiere registro y credenciales; no se deben simular líneas, horarios o paradas oficiales. El siguiente paso es descargar/validar el GTFS oficial y conectar OpenTripPlanner.

## Requisitos

- Node.js LTS compatible con Expo SDK 57.
- Android Studio + Android SDK.
- JDK compatible con la versión de Android Gradle Plugin generada por Expo.
- EAS CLI opcional para builds en la nube.

Guía paso a paso (dev client, compilar en Windows, Metro, Orbit): [`docs/desarrollo-android-local.md`](docs/desarrollo-android-local.md).

## Instalación

```bash
npm install
npx expo install --check
npx expo prebuild --platform android
npm run android
```

MapLibre incluye código nativo: **no funciona en Expo Go**. Hay que generar/reconstruir el proyecto Android después de instalar o actualizar el paquete.

Para iniciar Metro con un development build:

```bash
npm start
```

## APK

Build local standalone (con Android SDK configurado):

```bash
npm run android:apk
```

Genera `android/app/build/outputs/apk/release/app-release.apk`, embebe el bundle JS y puede instalarse y abrirse sin Metro.

Para desarrollo con hot reload:

```bash
npm start
npm run android
```

Build APK mediante EAS:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

El perfil `preview` genera APK instalable. `production` genera AAB para Play Store.

## Mapas y uso de tiles

El estilo de demostración configurado es solo para desarrollo. No usar el servidor demo ni los servidores públicos estándar de tiles de OpenStreetMap como backend de producción. Para producción configurar un proveedor de tiles con plan gratuito adecuado, un servidor propio o infraestructura autohospedada.

Configurar `EXPO_PUBLIC_MAP_STYLE_URL` en `.env` o en el entorno de build.

## Datos oficiales de transporte

- API IMM: https://api.montevideo.gub.uy/apidocs/publictransport
- Datos abiertos: https://ckan.montevideo.gub.uy/
- GTFS: consultar la API IMM; el feed estático se publica en `buses/gtfs/static/latest/google_transit.zip`.

No incluir tokens privados en variables `EXPO_PUBLIC_*`: se incorporan al bundle móvil. Las credenciales de la IMM deben permanecer en el backend.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Estructura

```text
app/                    Rutas Expo Router
src/
  components/           Componentes reutilizables
  db/                   SQLite y repositorios locales
  domain/                Modelos y contratos
  features/              Funcionalidades por dominio
  services/              Adaptadores de APIs externas
backend/
  app/                   API FastAPI inicial
```

## Decisiones pendientes antes de producción

1. Registrar una aplicación en el portal de APIs de la IMM y verificar límites/credenciales.
2. Validar el contenido, licencia, actualización y cobertura del GTFS.
3. Elegir proveedor de tiles para producción y revisar atribución/licencia.
4. Desplegar backend HTTPS; no exponer credenciales en la app.
5. Implementar tests de integración con el feed real y validar itinerarios en terreno.
