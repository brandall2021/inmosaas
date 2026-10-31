# Add Object Storage — Design

## Context

`src/lib/storage.ts` encapsula todo el acceso a archivos (imágenes de propiedades y documentos) sobre el filesystem local en `UPLOAD_DIR`, y lo sirve autenticado desde `/api/uploads/[...key]` y `/api/documentos/[...key]`. Su función explícita es "cambiarlo por object storage sin tocar el resto del código".

## Goals / Non-Goals

- **Goals**: driver S3-compatible bajo la misma interfaz; cero cambios en rutas y permisos; read-through para archivos preexistentes en disco; credenciales solo en env del server.
- **Non-Goals**: migración automática de datos al bucket, uploads directos desde el navegador con URLs pre-firmadas (v2), driver por tenant, compresión o transformación de imágenes.

## Decisions

- **`@aws-sdk/client-s3`** como runtime: un solo cliente cubre AWS, R2 y MinIO con `forcePathStyle`. Dependencia oficial y probada; la alternativa ligera (`aws4fetch`) obligaría a firmar y hacer streaming a mano.
- **Interfaz común en `storage.ts`**: `putObject(key, body, opts)`, `getObject(key)`, `deleteObject(key)`; los llamadores (`/api/uploads`, `/api/documentos`, generación de PDFs) no cambian de firma.
- **Detección de configuración al inicio del módulo**: si `STORAGE_DRIVER=s3` y faltan variables, se degrada a local con un log warn (no crash), como pide la spec; el modo local queda como hoy.
- **Streaming indirectos**: `/api/uploads` y `/api/documentos` siguen autenticando y sirven la respuesta con el stream de `GetObject`; no devolvemos URLs pre-firmadas (el control de permisos permanece server-side).
- **Read-through**: en `getObject`, si S3 responde `NotFound` y el archivo existe en `UPLOAD_DIR`, se sirve desde el disco; pensado para el período de migración.
- **E2E y desarrollo**: driver `local` por defecto; el CI no toca buckets reales. Tests del driver S3 con mocks de la interfaz; una prueba de integración real con MinIO queda como paso manual (compose de desarrollo opcional).
- **README**: tabla nueva de variables (`STORAGE_DRIVER` y `S3_*`) y nota de migración (copiar los objetos existentes al bucket es una tarea de operación fuera del código de la app).

## Open Questions

- ¿Script oficial de copia de disco → bucket? Fuera de alcance del código de la app (`aws s3 sync` desde la operación lo cubre), pero queda anotado para el despliegue.
