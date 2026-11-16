# Build local Android debug APK (dev client) for Ómnibus Tracker.
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
$env:GRADLE_OPTS = "-Dorg.gradle.workers.max=4"

if (-not (Test-Path "$Root\android")) {
  Push-Location $Root
  node ./node_modules/expo/bin/cli prebuild --platform android
  Pop-Location
}

# Ninja (CMake 3.22) falla con rutas >260 chars: compilar desde una unidad corta.
$Drive = "X:"
if (Test-Path "$Drive\") { subst $Drive /d | Out-Null }
# Se mapea el padre (no la raiz del proyecto): autolinking falla si package.json esta en la raiz de la unidad.
subst $Drive (Split-Path -Parent $Root)
try {
  Push-Location "$Drive\$(Split-Path -Leaf $Root)\android"
  # Limpiar cache CMake generada con la ruta larga
  Remove-Item -Recurse -Force "app\.cxx" -ErrorAction SilentlyContinue
  .\gradlew.bat assembleDebug --no-daemon -PreactNativeArchitectures=arm64-v8a
  Pop-Location
} finally {
  Set-Location $Root
  subst $Drive /d | Out-Null
}

$apk = "$Root\android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
  Write-Host "APK listo: $apk"
} else {
  Write-Error "No se generó app-debug.apk"
}