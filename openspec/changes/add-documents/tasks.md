## 1. Base de datos y dependencias

- [x] 1.1 Instalar `pdfkit` y `@types/pdfkit` en el proyecto; verificar con `npm install` limpio y `npm run typecheck` sin errores nuevos
- [x] 1.2 Agregar la tabla `documents` a `src/db/schema.ts` (uuid PK, `organizationId` cascade, `title`, `type`, `storageKey` único, `mimeType`, `sizeBytes`, `expiresAt` date nullable, `propertyId`/`clientId`/`rentalId` nullable con `set null`, timestamps tz, índices `(organizationId, createdAt)`, `(organizationId, type)` y relaciones); verificar con `npm run db:generate` generando la migración y `npx drizzle-kit check`/typecheck en verde
- [x] 1.3 Aplicar la migración en la base de desarrollo; verificar con `npm run db:migrate` contra `./.pgdata` y que la tabla `documents` existe (p.ej. `npm run db:studio` o query de conteo)

## 2. Storage y descarga

- [x] 2.1 Crear `src/features/documentos/document-constants.ts` con tipos permitidos (`pdf`, `docx`, `odt`, `xlsx`, `txt`), MIME↔extensión, límite de 10 MB y etiquetas en español; verificar con `npm run typecheck`
- [x] 2.2 Ampliar `src/lib/storage.ts` con `saveDocumentFile`, `readDocumentFile` y `deleteDocumentFile` (clave `uuid.ext`, misma defensa de path traversal y `UPLOAD_DIR`, sin tocar las funciones de imágenes); verificar con `npm run typecheck` y una corrida manual de guardado/lectura/borrado en un script temporario de Node
- [x] 2.3 Crear `src/app/api/documentos/[...key]/route.ts`: 401 sin sesión, 404 si la clave no pertenece a la organización activa (resuelto contra `documents`), 200 con MIME correcto, `inline` para PDF y `attachment` con nombre ASCII + `filename*` para el resto; verificar con la app en `npm run dev`: curl sin cookie → 401, con sesión propia → 200, con clave ajena/inválida → 404

## 3. Núcleo del módulo

- [x] 3.1 Agregar a `src/lib/validation.ts` los esquemas `documentUploadSchema`, `contractGenerateSchema` y `proposalGenerateSchema` (según specs: UUIDs opcionales, vigencia `YYYY-MM-DD`, longitudes máximas); verificar con `npm run typecheck`
- [x] 3.2 Crear `src/features/documentos/data.ts` (`listDocuments` con búsqueda por título y filtro por tipo, `getDocument`, `getDocumentByKey`, todos org-scoped y `server-only`); verificar con `npm run typecheck`
- [x] 3.3 Crear `src/features/documentos/actions.ts` con `deleteDocumentAction` (guard `owner`/`admin`, borra fila + archivo, `logActivity`, `revalidatePath`, redirect); verificar con `npm run dev`: como owner el borrado funciona y como member la acción no elimina nada
- [x] 3.4 Agregar "Documentos" (/documentos) a `primaryNav` en `src/components/app-shell/nav-items.ts`; verificar el enlace visible en el sidebar y la navegación en `npm run dev`
- [x] 3.5 Crear la página `/documentos` (listado con buscador, filtro por tipo, empty state, metadatos por fila y enlace a detalle, botón "Nuevo documento"); verificar en `npm run dev` con datos de prueba
- [x] 3.6 Crear la ficha `/documentos/[id]` con metadatos, enlaces a propiedad/cliente/alquiler cuando existan, botón de descarga y eliminación con confirmación; verificar en `npm run dev`

## 4. Repositorio de archivos (subida)

- [x] 4.1 Implementar `createDocumentUploadAction` en `src/features/documentos/actions.ts`: valida con `documentUploadSchema`, resuelve los vínculos con queries org-scoped (referencia ajena → error de campo), valida tipo y tamaño del archivo, persiste archivo + fila con rollback si algo falla y registra auditoría; verificar con `npm run dev` subiendo un PDF pequeño, un `.exe` rechazado y un PDF >10 MB rechazado
- [x] 4.2 Crear la página `/documentos/nuevo` con formulario `useActionState` (título, archivo, selects opcionales de propiedad/cliente/alquiler poblados con datos de la organización, errores por campo); verificar en `npm run dev` el alta exitosa redirigiendo a la ficha del documento

## 5. Contratos de alquiler

- [x] 5.1 Crear `src/features/documentos/pdf/contract.ts`: generador pdfkit server-only (encabezado organización, inmueble, partes, canon, período, condiciones adicionales opcionales, bloque de firmas, "No informado" en bloques faltantes); verificar generando un PDF localmente y abriéndolo (o validando cabecera `%PDF` y tamaño > 0)
- [x] 5.2 Implementar `generateContractAction` (lee alquiler + propiedad org-scoped, genera PDF, guarda archivo y fila tipo `contrato_alquiler` con vínculo, auditoría, redirige a la ficha del documento) y agregar el botón "Generar contrato" al detalle de `/alquileres/[id]`; verificar en `npm run dev` el flujo completo con un alquiler con y sin inquilino
- [x] 5.3 Verificar el snapshot: generar un contrato, editar el canon del alquiler y confirmar que el PDF descargado conserva el dato original mientras un contrato nuevo refleja el actual; verificar también que regenerar crea un segundo documento sin tocar el primero

## 6. Propuestas comerciales

- [x] 6.1 Crear `src/features/documentos/pdf/proposal.ts`: generador pdfkit server-only (inmueble, operación y precio, destinatario opcional, vigencia opcional, mensaje); verificar con PDF de prueba con y sin datos opcionales
- [x] 6.2 Implementar `generateProposalAction` (valida cliente org-scoped y vigencia, crea documento tipo `propuesta` con vínculos a propiedad/cliente, auditoría) y agregar "Generar propuesta" al detalle de `/propiedades/[id]` con formulario (destinatario, vigencia, mensaje); verificar en `npm run dev` la generación con cliente y sin cliente, y el rechazo de un cliente ajeno

## 7. Tests E2E y documentación

- [x] 7.1 Crear `e2e/documentos.spec.ts`: registro, alta de documento por subida (PDF en buffer), verificación de descarga (`%PDF` en el body), listado con filtro por tipo, búsqueda y borrado con confirmación; verificar con `npm run test:e2e -- documentos`
- [x] 7.2 Ampliar el e2e con flujo de contrato: crear propiedad, cliente y alquiler en el test, generar el contrato desde la ficha del alquiler, descargarlo y comprobar que aparece vinculado y en el listado; verificar con `npm run test:e2e -- documentos`
- [x] 7.3 Ampliar el e2e con flujo de propuesta: desde la ficha de la propiedad generar una propuesta con destinatario y vigencia y comprobar su descarga; verificar con `npm run test:e2e -- documentos`
- [x] 7.4 Documentar el módulo en el README: sección Documentos (tipos soportados, límite de 10 MB, permisos de eliminación, snapshot de contratos, aclaración de que la plantilla no constituye asesoramiento legal) y agregar el test al resumen de Tests; verificar con lectura del README renderizado
- [x] 7.5 Validación final: `npm run lint`, `npm run typecheck`, `npm run build` y `npm run test:e2e` completo en verde
