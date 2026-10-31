# Add Object Storage

## Why

Las imágenes de propiedades y los archivos de documentos se guardan hoy en el disco local (`UPLOAD_DIR`). En un despliegue real (múltiples instancias, backups, contenedores efímeros) eso no escala ni se puede respaldar de forma confiable. `src/lib/storage.ts` ya está aislado como abstracción con ese propósito explícito: el siguiente paso es un driver S3-compatible (AWS S3, Cloudflare R2, MinIO).

## What Changes

- Nuevo **driver S3-compatible** dentro de la abstracción de `storage.ts` (put / get / delete), seleccionado por configuración de entorno.
- Variables de entorno: `STORAGE_DRIVER` (`local` por defecto, `s3`), `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`. Con la misma configuración funciona AWS, R2 y MinIO.
- `S3_ENDPOINT` vacío = AWS con región configurada; con endpoint = MinIO/R2 (con `S3_FORCE_PATH_STYLE=1` necesario para R2/MinIO).
- **Cero cambios de contrato**: las URLs (`/api/uploads/[...key]`, `/api/documentos/<storageKey>`) y la verificación de sesión siguen iguales; el server lee desde el driver configurado en lugar del disco.
- **Read-through fallback local**: si el driver activo es `s3` y la clave no existe en el bucket, se intenta leer del disco como último paso (subidas hechas antes de la migración), sin tocar el driver `local` para escrituras nuevas.
- Claro: sin migración de datos automática; archivos existentes quedan servidos por el fallback y los nuevos van directo al bucket.

## Capabilities

### New Capabilities

- `storage`: comportamiento del almacenamiento configurable — selección de driver por entorno, mismas URLs para indican, read-through fallback y seguridad del driver.

### Modified Capabilities

<!-- Los requisitos de servicio autenticado de /api/uploads y /api/documentos no cambian. -->

## Impact

- **Dependencia nueva**: `@aws-sdk/client-s3` (runtime Node dentro de Next).
- **Modificado**: `src/lib/storage.ts` (interfaz común + drivers, `local` sin cambios de firma).
- **Cuidado**: los E2E siguen en `local` (`STORAGE_DRIVER` default) para no depender de un bucket en CI.
- **Tests**: unit de `put/get/delete` del driver S3 contra un MinIO en contenedor (opcional) o doble con aws-sdk-mock, y read-through fallback.
