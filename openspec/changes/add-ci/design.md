# Add CI Pipeline — Design

## Context

El proyecto ya expone `npm run typecheck`, `npm run lint`, `npm run build` y `npm run test:e2e`, y `playwright.config.ts` ya aísla cada corrida (el `globalSetup` borra y migra `.pgdata-e2e` y apunta `PGLITE_DATA_DIR`/`UPLOAD_DIR` a las carpetas aisladas). Falta únicamente el orquestador que los ejecute en el repositorio remoto.

## Goals / Non-Goals

- **Goals**: un único workflow de PR + push a `main`; cero secretos; corre estable en `ubuntu-latest`.
- **Non-Goals**: deploy automático, build/push de imagen Docker, matrix de múltiples versiones de Node, análisis de cobertura.

## Decisions

- **Node 24, npm ciphers**: se fija Node 24 (la versión con la que el proyecto está probado, rama estable actual) con `actions/setup-node` y `cache: npm` sobre `package-lock.json`.
- **Un solo job encadenado** (`npm ci` → typecheck → lint → build → test:e2e): un fallo corta los siguientes. Es más barato y determinista que jobs paralelos para el tamaño actual del proyecto; si la suite crece, se puede partir en dos jobs después sin cambiar la spec (el contrato exige que corran y que un fallo no se oculte).
- **Chromium con dependencias**: `npx playwright install --with-deps chromium` en el job de E2E (necesita libs de sistema que `ubuntu-latest` no trae por defecto). Binario cacheado bajo `~/.cache/ms-playwright`, invalidado por hash del lockfile.
- **Sin secretos**: la app arranca con defaults (PGlite local), así que el workflow no necesita `DATABASE_URL` ni ninguna credencial.
- **Badge**: icono de estado del workflow en el README, arriba del título.

## Open Questions

- Ninguno: alcance limitado a CI; el deploy se maneja en otros changes/futuros.
