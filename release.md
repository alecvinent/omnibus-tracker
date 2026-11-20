# Notas de release — Ómnibus Tracker

Este documento sigue el modelo de [semantic-release](https://semantic-release.org/) para determinar la próxima versión a partir de los commits convencionales.

## Versión actual

`0.1.0` (según `package.json`).

## Cambio incluido en este release

### fix: evitar pérdida de foco en campos origen/destino

- **Qué se arregló:** En Android, al tocar los campos de autocomplete de origen o destino, el teclado perdia el foco y no se podía escribir.
- **Causa:** El componente `HomeScreen` recalculaba estilos de layout (`searchCardRaised`, `fieldRowActive`) y cambiaba `pointerEvents` del mapa cada vez que un campo obtenía o perdía el foco. Esos re-calculos de layout interferían con el foco nativo del `TextInput` en Android.
- **Solución:**
  - Se eliminaron los estilos condicionales `searchCardRaised` y `fieldRowActive` del `StyleSheet` y de su uso en `app/index.tsx`.
  - Se eliminó el `pointerEvents` condicional sobre el contenedor del mapa (`MapView` actual es un placeholder sin interacción, por lo que no era necesario).
  - Se mantuvo el estado `activeField` únicamente para controlar la visibilidad del dropdown de sugerencias dentro de `PlaceAutocompleteField`.

## Evaluación de versión según semantic-release

Según [Conventional Commits](https://www.conventionalcommits.org/) y semantic-release:

| Tipo de commit | Impacto en versión (0.x) | Resultado |
|----------------|--------------------------|-----------|
| `fix`          | `patch`                  | `0.1.0` → `0.1.1` |
| `feat`         | `minor`                  | `0.1.0` → `0.2.0` |
| `BREAKING CHANGE` | `major` (si se respetara semver stricto) o `minor` en 0.x | `0.1.0` → `0.2.0` |

Este cambio es un **`fix`**, por lo tanto el siguiente release debe ser:

## **0.1.1**

### Commits propuestos

```text
fix(autocomplete): evitar pérdida de foco en campos origen/destino en Android
```

## Consideraciones para semantic-release en este repositorio

1. **Rama de desarrollo:** `develop`.
2. **Rama de release:** `main`.
3. **Flujo de ramas:** cada cambio entra por `feature/NNN-<slug>` o `fix/NNN-<slug>` y se fusiona a `develop` mediante PR.
4. **Tag inicial:** para que semantic-release comience a versionar desde `0.1.0`, el tag `v0.1.0` debe existir en el commit que publicó esa versión. Si no existe, semantic-release publicará `1.0.0` por defecto.
5. **Para mantener 0.x:** si se desea que semantic-release no salte a `1.0.0` automáticamente, se puede:
   - Publicar manualmente el tag `v0.1.0` en el commit base, o
   - Configurar `.releaserc` con la rama `next` o pre-release, o
   - Usar `@semantic-release/commit-analyzer` con `releaseRules` personalizadas.

## Checklist antes de publicar 0.1.1

- [ ] `npm run typecheck` pasa.
- [ ] `npm run lint` pasa sin errores.
- [ ] La APK debug se construye e instala correctamente.
- [ ] Se verifica en dispositivo Android que los campos origen/destino mantienen el foco.
- [ ] Se actualiza `CHANGELOG.md` (si se mantiene manualmente además de semantic-release).
