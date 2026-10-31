# Tasks: Add CI Pipeline

## 1. Workflow

- [x] 1.1 Crear `.github/workflows/ci.yml` con triggers `pull_request` (hacia `main`) y `push` (rama `main`), runner `ubuntu-latest`, Node 24 y caché de npm vía `actions/setup-node`
- [x] 1.2 Encadenar los pasos en un solo job: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`
- [x] 1.3 Agregar el paso de E2E: instalar Chromium (`npx playwright install --with-deps chromium`) y correr `npm run test:e2e`
- [x] 1.4 Cachear el binario de Playwright (`~/.cache/ms-playwright`) con clave por hash de `package-lock.json`
- [x] 1.5 *Ajuste hecho durante la verificación*: `npm run typecheck` ahora ejecuta `next typegen && tsc --noEmit` (Next 16 genera los tipos de rutas en el build; sin `typegen` el CI falla con `TS2304: Cannot find name 'LayoutProps'`)

## 2. Documentación

- [x] 2.1 Agregar el badge del workflow en el README y una sección "CI" breve que explique qué corre el pipeline

## 3. Verificación

- [x] 3.1 Surgir un PR con un error intencional de tipado y confirmar que el chequeo de CI falla sin ejecutar E2E
- [x] 3.2 Corregir el error y confirmar que el chequeo queda en verde y una segunda corrida reutiliza la caché
