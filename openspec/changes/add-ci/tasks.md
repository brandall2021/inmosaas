# Tasks: Add CI Pipeline

## 1. Workflow

- [ ] 1.1 Crear `.github/workflows/ci.yml` con triggers `pull_request` (hacia `main`) y `push` (rama `main`), runner `ubuntu-latest`, Node 24 y caché de npm vía `actions/setup-node`
- [ ] 1.2 Encadenar los pasos en un solo job: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`
- [ ] 1.3 Agregar el paso de E2E: instalar Chromium (`npx playwright install --with-deps chromium`) y correr `npm run test:e2e`
- [ ] 1.4 Cachear el binario de Playwright (`~/.cache/ms-playwright`) con clave por hash de `package-lock.json`

## 2. Documentación

- [ ] 2.1 Agregar el badge del workflow en el README y una sección "CI" breve que explique qué corre el pipeline

## 3. Verificación

- [ ] 3.1 Surgir un PR con un error intencional de tipado y confirmar que el chequeo de CI falla sin ejecutar E2E
- [ ] 3.2 Corregir el error y confirmar que el chequeo queda en verde y una segunda corrida reutiliza la caché
