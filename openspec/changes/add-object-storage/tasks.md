# Tasks: Add Object Storage

## 1. Driver S3-compatible

- [ ] 1.1 Agregar `@aws-sdk/client-s3` y detectar configuración (`STORAGE_DRIVER`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`)
- [ ] 1.2 Implementar los métodos `putObject`, `getObject` y `deleteObject` de `src/lib/storage.ts` con el driver s3, degradando a local con log warn cuando la configuración está incompleta
- [ ] 1.3 Implementar el read-through: si el bucket responde `NotFound` y la clave existe en `UPLOAD_DIR`, servir desde el disco
- [ ] 1.4 Verificar que `/api/uploads/[...key]` y `/api/documentos/[...key]` sirven streams del driver activo sin cambiar permisos ni firmas

## 2. Configuración y documentación

- [ ] 2.1 Documentar en el README la tabla de variables (driver local vs s3, AWS vs R2/MinIO) y la nota de migración de archivos existentes
- [ ] 2.2 Agregar ejemplo de variables de entorno para MinIO y para AWS (sin valores sensibles)

## 3. Tests

- [ ] 3.1 Test unitario del driver con mocks: put, get, delete, NotFound + read-through, y degradación a local por configuración incompleta
- [ ] 3.2 Prueba manual con MinIO en local: subir una imagen y un documento y verificar la descarga autenticada

## 4. Verificación

- [ ] 4.1 `npm run lint`, `npm run typecheck` y `npm run test:e2e` en verde con el driver local (sin bucket en CI)
