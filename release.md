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

## Configuración de semantic-release

Se agregó `semantic-release` con los plugins:
- `@semantic-release/commit-analyzer` (preset `conventionalcommits`)
- `@semantic-release/release-notes-generator` (preset `conventionalcommits`)
- `@semantic-release/changelog`
- `@semantic-release/git`

Archivos:
- `.releaserc.json`: configuración de semantic-release.
- `package.json`: scripts `semantic-release` y `semantic-release:dry`.
- `package-lock.json`: dependencias instaladas.

### Ramas

- **Desarrollo:** `develop`.
- **Release:** `main`.
- **Remoto:** `https://github.com/alecvinent/omnibus-tracker.git`

### Tag inicial

Para que semantic-release parta de `0.1.0`, se creó el tag `v0.1.0` en el commit base (`0a63300`). Sin este tag, semantic-release publicaría `1.0.0` por defecto.

### Push inicial

```bash
git remote add origin https://github.com/alecvinent/omnibus-tracker.git
git push -u origin develop
git push origin v0.1.0
```

### QA local

```bash
npm run semantic-release:dry
```

Este comando ejecuta semantic-release en modo dry-run sobre la rama `feature/021-semantic-release` y muestra la versión que se publicaría sin modificar el repo.

### Notas

- El plugin `@semantic-release/github` se omite de `.releaserc.json` porque requiere un token (`GH_TOKEN`/`GITHUB_TOKEN`) y un repositorio remoto configurado. Se debe agregar en CI cuando exista el repo remoto.
- En CI, semantic-release debe correr solo en merges a `main` y con el token de GitHub configurado.

## Checklist antes de publicar 0.1.1

- [ ] `npm run typecheck` pasa.
- [ ] `npm run lint` pasa sin errores.
- [ ] La APK debug se construye e instala correctamente.
- [ ] Se verifica en dispositivo Android que los campos origen/destino mantienen el foco.
- [ ] Se actualiza `CHANGELOG.md` (si se mantiene manualmente además de semantic-release).
