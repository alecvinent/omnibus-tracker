# ¡Prueba en el teléfono!

## Estado actual

- **Backend FastAPI**: en `https://omnibus-tracker.fastapicloud.dev/` (geocodificación mediada vía Nominatim) ✅
- **APK local**: `npm run android:apk` genera una APK **release standalone** que embebe el bundle JS.
- **APK instalada**: `com.badwarren.omnibustracker` (versión 0.1.0)

## Cómo generar e instalar la APK

1. En la PC, ejecutar:

   ```bash
   npm run android:apk
   ```

2. Copiar `android/app/build/outputs/apk/release/app-release.apk` al teléfono.
3. Instalarla y abrirla. **No hace falta tener Metro corriendo**.

> Para desarrollo con hot reload seguir usando `npm start` + `npm run android`.

---

## ¿Qué debe ver si funciona?

1. La app **Ómnibus Tracker** abre.
2. Pantalla principal:
   - Título: `¿A dónde vamos?` y subtexto `Planificá tu viaje`.
   - Buscador de origen/destino con autocomplete.
   - Mapa centrado en Montevideo.

### Prueba concreta el autocomplete

1. Escribe **"Plaza"** en el campo de destino.
2. Deben aparecer sugerencias reales (requiere conectividad).
3. Toca una sugerencia.
4. El mapa debe centrarse y mostrar una línea de vista previa entre origen y destino.

---

## Si no se carga la app

| Síntoma | Qué hacer |
|---------|-----------|
| Pantalla en blanco al abrir | Verificar que se usó `npm run android:apk` (release), no `npm run android` (debug/dev client). |
| "App no instalada" / firma | Desinstalar la versión anterior antes de instalar la nueva APK. |
| Autocomplete sin resultados | Revisar conectividad a Internet y que `EXPO_PUBLIC_API_URL` esté configurado. |
| El mapa no muestra calles | Revisar conectividad y `EXPO_PUBLIC_MAP_STYLE_URL`. |

---

## Checklist

- [ ] ¿La APK abre sola sin la PC encendida?
- [ ] ¿Mapa centrado en Montevideo?
- [ ] ¿Autocomplete mostró resultados reales?
- [ ] ¿Pulsaste "GPS" y obtuviste ubicación actual?
- [ ] ¿Puedes buscar un viaje y ver la pantalla de resultados?
