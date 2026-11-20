# Despliegue de Ómnibus Tracker

Este documento resume las opciones de hosting y distribución para el proyecto.

## Stack de despliegue propuesto

| Componente | Servicio elegido | Notas |
|------------|------------------|-------|
| Backend (FastAPI) | [FastAPI Cloud](https://fastapicloud.com) | Hosting específico para aplicaciones FastAPI. |
| App móvil (Expo/React Native) | **EAS (Expo Application Services)** + stores oficiales | Build, OTA updates y submission a Play Store / App Store. |
| Base de datos / estado | SQLite local en el dispositivo | Sin servidor de base de datos propio en el MVP. |

---

## Backend

### FastAPI Cloud

Se elige **FastAPI Cloud** como plataforma de hosting del backend porque:

- Está optimizada para aplicaciones FastAPI.
- Simplifica el despliegue de la API de geocodificación y futuros endpoints de planificación.
- Permite escalar el backend sin reescribir la aplicación.

**Variables de entorno mínimas en FastAPI Cloud:**
- `NOMINATIM_USER_AGENT`: identificador para las peticiones a Nominatim.
- Posibles credenciales de la IMM cuando se integre la API oficial (BL-001 / BL-002).

**URL de desarrollo configurada:**
- `EXPO_PUBLIC_API_URL=https://omnibus-tracker.fastapicloud.dev/` (ver `.env.dev` y `.env.example`).

---

## App móvil

### Alternativas evaluadas

| Opción | Tipo | Costo | Ventajas | Desventajas | Recomendación |
|--------|------|-------|----------|-------------|---------------|
| **Expo Application Services (EAS)** | Build, OTA updates, distribución interna, submission a stores | Gratis con límites; planes pagos | Integración nativa con Expo; maneja certificados; updates de JS sin rebuild | Límites en plan gratuito | **Opción principal** |
| **Google Play Store** | Store público Android | $25 una vez (cuenta de desarrollador) | Alcance masivo; actualizaciones automáticas | Requiere cuenta y proceso de revisión | **Producción Android obligatoria** |
| **Apple App Store** | Store público iOS | $99/año (Apple Developer Program) | Alcance masivo iOS | Costo anual; revisión estricta | **Producción iOS obligatoria** |
| **Firebase App Distribution** | Beta testing Android/iOS | Gratis | Fácil de enviar a testers; sin revisión de store | Solo distribución, no producción | **Beta Android** |
| **TestFlight** | Beta testing iOS | Incluido en Apple Dev | Oficial de Apple; integrado | Requiere Apple Developer Program | **Beta iOS** |
| **Microsoft App Center** | Build + test + distribución | Gratis con límites | CI/CD genérico; no depende de Expo | Menos integrado con el ecosistema Expo | Alternativa viable |
| **APK directo** | Instalación manual Android | Gratis | Rápido para pruebas internas | Solo Android; sin actualizaciones automáticas | Pruebas muy tempranas |
| **F-Droid** | Store open source Android | Gratis | Respetuoso con software libre | Requiere cumplir políticas open source; sin servicios de Google | Si se decide publicar como FOSS |

### Recomendación

Para Ómnibus Tracker se recomienda:

1. **Desarrollo y QA:**
   - Usar **EAS Build** para generar APK/IPA en la nube.
   - Distribuir betas con **Firebase App Distribution** (Android) y **TestFlight** (iOS).

2. **Producción:**
   - Publicar en **Google Play Store** (Android) y **Apple App Store** (iOS).
   - Usar **EAS Submit** para automatizar el envío a las stores.

3. **Actualizaciones:**
   - Usar **EAS Update** para corregir bugs en la capa de JavaScript sin necesidad de un nuevo build nativo.

### Pasos de alto nivel con EAS

1. Instalar EAS CLI: `npm install -g eas-cli`.
2. Iniciar sesión: `eas login`.
3. Configurar proyecto: `eas build:configure`.
4. Generar build de desarrollo/preview: `eas build --platform android --profile development`.
5. Enviar a store: `eas submit --platform android` / `eas submit --platform ios`.
6. Publicar OTA update: `eas update --branch production --message "fix: ..."`.

---

## Decisiones pendientes

- [x] Configurar URL de desarrollo de FastAPI Cloud en `.env.dev`.
- [ ] Desplegar backend estable en FastAPI Cloud y validar `/health`.
- [ ] Crear cuenta de Google Play Console ($25).
- [ ] Crear Apple Developer Program ($99/año) si se quiere soportar iOS.
- [ ] Configurar `eas.json` con perfiles de build (development, preview, production).

---

## Referencias

- [Expo Application Services](https://expo.dev/eas)
- [FastAPI Cloud](https://fastapicloud.com)
- [Google Play Console](https://play.google.com/console)
- [Apple Developer Program](https://developer.apple.com/programs/)
