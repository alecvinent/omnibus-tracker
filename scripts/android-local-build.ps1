# Build local Android release APK (standalone) for Ómnibus Tracker.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Jdk = "C:\working\projects\ideas-I+D+I\android-tools\jdk-17"
$Sdk = "C:\working\projects\ideas-I+D+I\android-tools\Sdk"

if (-not (Test-Path "$Jdk\bin\java.exe")) {
  Write-Error "JDK 17 no encontrado en $Jdk"
}
if (-not (Test-Path "$Sdk\platform-tools\adb.exe")) {
  Write-Error "Android SDK no encontrado en $Sdk"
}

$env:JAVA_HOME = $Jdk
$env:ANDROID_HOME = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk
$env:NODE_ENV = "production"
$env:GRADLE_OPTS = "-Dorg.gradle.workers.max=4"

if (-not (Test-Path "$Root\android")) {
  Push-Location $Root
  node ./node_modules/expo/bin/cli prebuild --platform android
  Pop-Location
}

# Ninja (CMake 3.22) falla con rutas >260 chars. Usamos un junction corto en C:
# para que Kotlin/Gradle no mezcle roots de unidad (X:) con las dependencias.
$Junction = "C:\omnibus-tracker"
if (Test-Path $Junction) {
  # Puede ser un junction anterior o un directorio; no forzamos recursivo por seguridad.
  (Get-Item $Junction).Delete() | Out-Null
}
New-Item -ItemType Junction -Path $Junction -Target $Root | Out-Null
try {
  Push-Location "$Junction\android"
  # Limpiar cache CMake generada con la ruta larga y caches de Kotlin de dependencias
  # que pueden haberse corrompido al compilar desde una unidad distinta (X:).
  Remove-Item -Recurse -Force "app\.cxx" -ErrorAction SilentlyContinue
  Get-ChildItem -Path "$Junction\node_modules" -Recurse -Directory -Filter "build" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*\android\build" } |
    ForEach-Object { Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue }
  .\gradlew.bat assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a
  Pop-Location
} finally {
  Set-Location $Root
  if (Test-Path $Junction) { (Get-Item $Junction).Delete() | Out-Null }
}

$apk = "$Root\android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apk) {
  Write-Host "APK listo: $apk"
} else {
  Write-Error "No se generó app-release.apk"
}