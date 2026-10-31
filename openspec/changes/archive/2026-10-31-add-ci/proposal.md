# Add CI Pipeline

## Why

Los cambios en InmoSaaS se integran a `main` sin verificación automática: `typecheck`, `lint`, el build de producción y la suite E2E corren solo a mano, así que una regresión puede llegar a la rama principal sin que nadie la note.

## What Changes

- Nuevo workflow de GitHub Actions que corre en cada pull request hacia `main` y en cada push a `main`.
- Cadena de verificación: `npm ci` (con caché), `typecheck`, `lint`, `build` de producción y `npm run test:e2e` (Playwright, Chromium).
- Los E2E aprovechan el aislamiento que ya existe en el proyecto (PGlite embebido en `.pgdata-e2e`, subidas en `.uploads-e2e`): el pipeline no necesita secretos ni servicios externos.
- Badge de estado del workflow en el README.

## Capabilities

### New Capabilities

- `ci`: contrato del pipeline — qué verificaciones corre, en qué disparadores, con qué aislamiento de datos y bajo qué condiciones se marca fallido.

### Modified Capabilities

<!-- Ninguna: no cambia el comportamiento en runtime de la aplicación. -->

## Impact

- **Código nuevo**: `.github/workflows/ci.yml`.
- **Modificado**: `README.md` (badge + sección de CI).
- **Dependencias**: ninguna nueva en la app; el runner instala Chromium vía `npx playwright install --with-deps chromium`.
- **Tests**: la suite E2E existente pasa a ser la barrera de integración del pipeline.
