## Purpose

Almacenamiento de archivos de la aplicación con driver seleccionable por entorno: disco local (valor por defecto, sin cambios) o bucket S3-compatible (AWS S3, Cloudflare R2, MinIO), manteniendo las mismas URLs y el mismo control de acceso por sesión.

## ADDED Requirements

### Requirement: Selección de driver por entorno

El almacenamiento SHALL elegir el driver según `STORAGE_DRIVER`: `local` (por defecto) guarda en `UPLOAD_DIR`, y `s3` usa el bucket configurado con `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`. Si el driver es `s3` y la configuración está incompleta, la aplicación SHALL arrancar con el driver local y registrar el motivo en el log del server.

#### Scenario: Arranque con S3 completo

- **WHEN** `STORAGE_DRIVER=s3` con las variables S3 completas
- **THEN** las subidas nuevas se guardan en el bucket configurado

#### Scenario: Configuración incompleta degrada a local

- **WHEN** `STORAGE_DRIVER=s3` pero falta `S3_BUCKET`
- **THEN** la aplicación arranca con el driver local y el log del server registra la variable que faltó

### Requirement: Compatibilidad AWS, R2 y MinIO

Con el mismo set de variables, el driver S3 SHALL funcionar con AWS (sin `S3_ENDPOINT`, resolviendo por región) y con MinIO o Cloudflare R2 (con `S3_ENDPOINT` y `S3_FORCE_PATH_STYLE=1`), que require while estilo de direccionamiento por path.

#### Scenario: Endpoint de MinIO

- **WHEN** el despliegue usa MinIO con `S3_ENDPOINT` y force-path-style activo
- **THEN** las operaciones de put, get y delete alcanzan el bucket en ese endpoint

#### Scenario: AWS por defecto

- **WHEN** el despliegue usa las variables S3 sin endpoint
- **THEN** el driver resuelve el bucket en la región configurada de AWS

### Requirement: URLs y acceso sin cambios

Las URLs de archivos (`/api/uploads/[...key]` y `/api/documentos/<storageKey>`) SHALL seguir servidas por los mismos endpoints con verificación de sesión y pertenencia a la organización activa, independientemente del driver activo. El navegador nunca SHALL recibir credenciales del bucket ni URLs pre-firmadas persistentes.

#### Scenario: Descarga con S3 activo

- **WHEN** un miembro descarga un documento guardado en el bucket
- **THEN** la descarga pasa por `/api/documentos/<key>` con la sesión validada, sin cambiar de URL ni exponer credenciales

### Requirement: Read-through fallback local

Con el driver `s3` activo, cuando una clave no existe en el bucket pero sí existe en `UPLOAD_DIR`, el endpoint SHALL servir el archivo desde el disco. Las escrituras nuevas SHALL ir únicamente al driver activo, sin duplicar en ambos lugares.

#### Scenario: Archivo pre-migración local

- **WHEN** se pide un archivo subido antes de activar S3, con el driver s3 activo
- **THEN** se sirve desde el disco local sin error

#### Scenario: Subida nueva va al bucket

- **WHEN** con el driver s3 activo se sube una imagen nueva
- **THEN** el archivo solo se guarda en el bucket

### Requirement: Borrado por driver activo

El borrado SHALL ejecutarse en el driver activo; con el driver `s3`, SHALL operar únicamente sobre el bucket y SHALL eliminar igual la fila de base de datos correspondiente sin fallar cuando el objeto ya no existe en el bucket.

#### Scenario: Delete idempotente

- **WHEN** se ejecuta el borrado de un objeto que ya no está en el bucket
- **THEN** la fila correspondiente se elimina igual y no se devuelve error
