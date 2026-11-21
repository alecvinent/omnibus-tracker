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

Todavía no incluye cálculo real de itinerarios ni feed GTFS integrado. La fuente principal es la API de transporte público de la IMM (https://api.montevideo.gub.uy/apidocs/publictransport): requiere cuenta gratuita y credenciales OAuth2 que se guardan solo en el backend. No se deben simular líneas, horarios o paradas oficiales. El siguiente paso es descargar/validar el GTFS de la IMM y conectar OpenTripPlanner.

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

- API IMM (posiciones en tiempo real y ETA): https://api.montevideo.gub.uy/apidocs/publictransport
- Registro de cuenta gratuita: https://api.montevideo.gub.uy/signup
- Especificación Swagger: https://api.montevideo.gub.uy/swagger/spec/publictransport.json
- Datos abiertos: https://ckan.montevideo.gub.uy/
- GTFS de la IMM: `https://api.montevideo.gub.uy/api/transportepublico/buses/gtfs/static/latest/google_transit.zip`

La API usa OAuth2 `client_credentials` contra `https://mvdapi-auth.montevideo.gub.uy/token` y tiene un límite de **10 llamadas por minuto**; por eso se consume desde el backend, con caché, nunca desde la app. Ver `docs/data-sources.md`.

No incluir tokens ni credenciales en variables `EXPO_PUBLIC_*`: se incorporan al bundle móvil. Las credenciales de la IMM (`IMM_CLIENT_ID` / `IMM_CLIENT_SECRET`) deben permanecer en el backend; ver `backend/.env.example`.

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

1. Registrar una cuenta y una aplicación en el portal de APIs de la IMM (BL-001) y cargar `IMM_CLIENT_ID` / `IMM_CLIENT_SECRET` solo en el backend.
2. Validar el contenido, licencia, actualización y cobertura del GTFS publicado por la IMM.
3. Elegir proveedor de tiles para producción y revisar atribución/licencia.
4. Desplegar backend HTTPS; no exponer credenciales de la IMM ni API keys del backend en la app.
5. Implementar tests de integración con el feed real y validar itinerarios en terreno.
