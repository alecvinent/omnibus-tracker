# Desarrollo Android local (dev client)

Este proyecto **no funciona en Expo Go**. Usa módulos nativos (`expo-dev-client`, MapLibre, SQLite, etc.). Hay que instalar un **development build** (dev client) en el teléfono y conectarlo a Metro en la PC.

## Requisitos en esta máquina

| Variable / ruta | Valor |
|-----------------|--------|
| `ANDROID_HOME` / `ANDROID_SDK_ROOT` | `C:\working\projects\ideas-I+D+I\android-tools\Sdk` |
| JDK para Gradle | **Java 17** — `C:\working\projects\ideas-I+D+I\android-tools\jdk-17` |
| JDK 25 | No usar con Gradle/CMake de React Native (falla `configureCMake`) |

El SDK debe incluir (ya instalado con `sdkmanager`):

- `platform-tools`
- `platforms;android-36`
- `build-tools;36.0.0`
- `ndk;27.1.12297006`

Licencias: `sdkmanager --licenses` (aceptar todas).

## Compilar APK release local (standalone)

Desde la raíz del proyecto:

```powershell
npm run android:apk
```

Equivalente:

```powershell
.\scripts\android-local-build.ps1
```

Salida:

```text
android\app\build\outputs\apk\release\app-release.apk
```

La primera compilación puede tardar **15–25 minutos**. Gradle necesita bastante RAM (`android/gradle.properties` usa heap ~6 GB).

Solo instalar el APK ya generado:

```powershell
adb install -r android\app\build\outputs\apk\release\app-release.apk
```

## Metro (bundler JS)

Archivo `.env` en la raíz (no commitear secretos):

```env
EXPO_PUBLIC_MAP_STYLE_URL=https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json
EXPO_PUBLIC_API_URL=http://192.168.1.9:8000
EXPO_PUBLIC_API_KEY=cambia_por_tu_api_key
```

Ajustá `192.168.1.9` a la IP Wi‑Fi de la PC (`ipconfig`). El backend FastAPI en `:8000` es **necesario** para el autocomplete de lugares (`GET /v1/geocode/search`). Con USB podés usar `EXPO_PUBLIC_API_URL=http://localhost:8000` y `adb reverse tcp:8000 tcp:8000` en lugar de la IP LAN.

Levantar Metro para dev client:

```powershell
cd omnibus-tracker
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.9"   # IP LAN de la PC
$env:CI = $null
node ./node_modules/expo/bin/cli start --dev-client --lan --port 8081
```

En el teléfono (app **Ómnibus Tracker**, no Expo Go):

- URL manual: `http://192.168.1.9:8081`
- Misma red Wi‑Fi; conviene **pausar VPN** si el bundle no carga.
- Si Windows pide firewall, permitir **Node.js** en red privada.

## Orbit / ADB inalámbrico

1. Depuración inalámbrica activada en el teléfono.
2. Emparejar en Orbit o: `adb pair IP:PUERTO_PAIR` y luego `adb connect IP:PUERTO_CONEXION`.
3. Verificar: `adb devices -l`.
4. En Orbit: abrir este proyecto → **Run** contra Metro.

## EAS (alternativa a compilar local)

Perfil **`development`** (`eas.json`) — incluye dev client:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile development
```

Perfil **`preview`** genera APK standalone **sin** menú de desarrollo; **no** sustituye al dev client para Metro.

```bash
npm run eas:build:development
```

## Errores frecuentes

| Síntoma | Causa | Qué hacer |
|---------|--------|-----------|
| *Something went wrong* en **Expo Go** | Expo Go no soporta este proyecto | Instalar dev client (`app-release.apk` local o build `development`) |
| Carga infinita en el teléfono | Metro inalcanzable, IP incorrecta o firewall | `REACT_NATIVE_PACKAGER_HOSTNAME`, misma Wi‑Fi, regla firewall |
| Solo bundles `web` en consola | Abrís web, no la app nativa | Abrí Ómnibus Tracker y URL `http://IP:8081` |
| `Gradle daemon disappeared` | Poca RAM | Reintentar; cerrar apps pesadas; heap en `gradle.properties` |
| `ndk` / licencias | SDK incompleto | `sdkmanager` + `--licenses` |
| CMake con JDK 25 | Java incorrecto | `JAVA_HOME` → JDK 17 portable |

## Recordatorio

- **No usar Expo Go** para este repo.
- Credenciales de la API IMM (`IMM_CLIENT_ID` / `IMM_CLIENT_SECRET`) y API keys del backend: solo en el **backend**, nunca en `EXPO_PUBLIC_*` con secretos. Registro: https://api.montevideo.gub.uy/signup; ver `docs/data-sources.md`.
- MapLibre en el componente actual puede ser placeholder; el binario nativo sí incluye MapLibre.