## Purpose

Pipeline de integración continua en GitHub Actions que garantiza que todo cambio hacia `main` compila, pasa lint y typecheck, construye en modo producción y supera la suite E2E antes de integrarse.

## ADDED Requirements

### Requirement: Ejecución en PRs y pushes a main

El pipeline SHALL ejecutarse en cada pull request hacia `main` y en cada push a `main`, y SHALL reportar CHECK successful únicamente cuando todo el encadenado de verificaciones termine sin error.

#### Scenario: PR con verificación completa

- **WHEN** se abre un pull request que toca código de la aplicación
- **THEN** se ejecutan typecheck, lint, build y la suite E2E, y el PR muestra el chequeo de CI en GitHub

#### Scenario: Error que bloquea la integración

- **WHEN** el typecheck falla en un pull request
- **THEN** el chequeo de CI se marca como fallido y los pasos posteriores no se ejecutan

### Requirement: Verificaciones encadenadas

El pipeline SHALL ejecutar, en orden y en un único job: instalación de dependencias con `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build` y `npm run test:e2e`. Cualquier paso fallido SHALL cortar los subsequentes.

#### Scenario: Suite E2E en verde integra

- **WHEN** typecheck, lint y build pasan y la suite E2E termina exitosamente
- **THEN** el job de CI se marca exitoso

#### Scenario: Build roto detecta temprano

- **WHEN** `next build` falla en el pipeline
- **THEN** la suite E2E no se ejecuta y el job se marca fallido

### Requirement: Aislamiento de datos en E2E

El pipeline SHALL correr los tests E2E con el aislamiento existente del proyecto (base en `.pgdata-e2e` y subidas en `.uploads-e2e`) sin requerir secretos ni servicios externos, con Chromium instalado por el propio workflow.

#### Scenario: Suite verde en runner limpio

- **WHEN** el workflow corre en un runner recién aprovisionado
- **THEN** la suite E2E pasa usando exclusivamente PGlite embebido y el Chromium instalado en el paso de setup

### Requirement: Caché de dependencias

El pipeline SHALL reutilizar las dependencias de npm y el cache de Playwright entre corridas usando como clave el hash de `package-lock.json`, sin comprometer la corrección.

#### Scenario: Corrida repetida sin cambios de dependencias

- **WHEN** `package-lock.json` no cambió entre corridas
- **THEN** la instalación y los navegadores de Playwright se reutilizan desde caché

### Requirement: Sin secretos requeridos

El pipeline SHALL funcionar completamente sin secretos del repositorio, dado que la app arranca con valores por defecto en desarrollo y los tests usan PGlite embebido.

#### Scenario: Fork sin configuración

- **WHEN** el workflow corre en un repo sin secretos configurados
- **THEN** todos los pasos se ejecutan con éxito
