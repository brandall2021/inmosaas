## Context

InmoSaaS es Next.js 16 (App Router, Server Actions) + Drizzle ORM con PGlite en dev y Postgres en prod, multi-tenant por `organizationId`, con patrones ya establecidos: server actions con `ActionState`/`useActionState`, guards en `src/lib/dal.ts`, auditoría best-effort con `activity_logs`, y almacenamiento de binarios en `UPLOAD_DIR` servido por una ruta autenticada (`/api/uploads/[...key]` para imágenes de propiedades). Hoy no existe generación de PDF ni descarga de archivos no-imagen en el código (verificado en el explore). Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Un módulo `/documentos` con listado unificado, detalle, descarga y borrado.
- Generación server-side de PDFs (contratos y propuestas) persistidos como archivos.
- Subida de archivos de oficina con validación de tipo/tamaño.
- Reutilizar los patrones existentes de tenant, permisos, auditoría y validación sin tocar el comportamiento de los módulos actuales.

**Non-Goals:**

- Editor de plantillas de PDF personalizables por tenant.
- Firma digital, validación de identidad o flujo de aprobación de contratos.
- Versionado de documentos (regenerar crea un documento nuevo, no una versión).
- Object storage (S3 u otros): se conserva el filesystem local ya aislado tras `storage.ts`.
- Extracción de datos de archivos subidos (OCR, parseo de DOCX).
- Notificaciones o envío de documentos por correo.

## Decisions

1. **Tabla única `documents` con `type` en texto** (`contrato_alquiler` | `propuesta` | `archivo`), en lugar de una tabla por tipo de documento generado.
   Un solo modelo unifica listado, descarga, permisos, auditoría y borrado (evita triplicar esa lógica). Los campos específicos de cada tipo viven en el PDF (snapshot) más tres columnas ligeras compartidas: `expiresAt` (date nullable, usado por propuestas) y los vínculos opcionales `propertyId` / `clientId` / `rentalId` con `onDelete: "set null"`, siguiendo el patrón de `rentals`.
   Alternativa descartada: tablas separadas `rental_contracts` / `proposals` — duplicaría storage, endpoint de descarga, permisos y UI por poca ganancia semántica.

2. **Generación de PDF con `pdfkit`** en el server, emitiendo un `Buffer` que se persiste vía storage.
   `pdfkit` es independiente de React (sin fricción de peer deps con React 19/Next 16), escribe directo a stream/buffer y trae fuentes estándar (Helvetica) sin descargar assets, suficiente para documentos de texto con encabezado, datos y firmas. Las fuentes se registran como `server-only`.
   Alternativas descartadas: `@react-pdf/renderer` (depende de React en el runtime de render, más pesado y con restricciones de versión); HTML + "Imprimir a PDF" en el navegador (no produce un artefacto PDF almacenable ni descargable); Playwright/Puppeteer (requiere un browser en producción, costo operativo enorme para esto).

3. **Extender `src/lib/storage.ts` con funciones específicas de documentos** manteniendo intactas las de imágenes.
   Se agregan mapas de MIME↔extensión para `pdf|docx|odt|xlsx|txt`, el patrón de clave ampliado (`uuid.(pdf|docx|odt|xlsx|txt)`) y `saveDocumentFile` / `readDocumentFile` / `deleteDocumentFile`, reutilizando el mismo `UPLOAD_DIR` y la defensa de path traversal existente. Las funciones de imagen no cambian: cero riesgo de regresión en la galería de propiedades.
   Alternativa descartada: refactor general a un storage unificado por categorías — más elegante, pero mezcla riesgo en un módulo ya probado sin necesidad.

4. **Endpoint propio `src/app/api/documentos/[...key]/route.ts`** para servir documentos.
   Mismo esquema de autorización que `/api/uploads`: sesión + organización activa + ownership resuelto contra la fila `documents` (nunca confiando solo en la clave). `Content-Disposition: inline` para PDF (previsualización en pestaña) y `attachment` para el resto, con nombre ASCII de fallback más `filename*` (RFC 5987) para títulos con acentos.
   Alternativa descartada: colgar la descarga de documentos del endpoint existente de imágenes — mezclaría ownership checks de tablas distintas en un solo handler.

5. **Generar = action que crea fila + archivo en una sola operación**, con rollback de la fila si falla el storage.
   El PDF se arma con los datos leídos en ese momento (snapshot); la fila se inserta recién con la clave del archivo persistido. Si la escritura del archivo falla, no se crea la fila (y a la inversa, si la inserción falla, se intenta borrar el archivo huérfano). Regenerar produce un documento nuevo: historial completo de contratos/propuestas por entidad.

6. **Permisos: ver/generar/subir para cualquier miembro; eliminar solo `owner`/`admin`**, replicando el criterio de baja del resto de la app (`hasRole(role, ["owner","admin"])`). Los contratos no son "más sensibles" que los datos del alquiler en sí, que cualquier miembro ya ve.

7. **Contenido de los PDFs: plantilla fija con datos reales + extras opcionales**.
   Contrato: encabezado con la organización, datos del inmueble, partes (propietario del inmueble = cliente `propietario` si el alquiler no lo trae — se usa el dato disponible del alquiler/propiedad), canon, período, condiciones adicionales libres y bloque de firmas. Propuesta: inmueble, precio, destinatario opcional, vigencia opcional y mensaje. Los bloques faltantes se imprimen como "No informado". No se resuelve texto legal por jurisdicción: es una plantilla base, no asesoramiento legal (quedará aclarado en el README).

8. **Validación Zod en `src/lib/validation.ts`**: `documentUploadSchema` (título + vínculos UUID opcionales + archivo), `contractGenerateSchema` (condiciones adicionales opcional, ≤ 5000 chars) y `proposalGenerateSchema` (cliente opcional, vigencia fecha opcional, mensaje opcional). Los vínculos se resuelven con queries org-scoped antes de crear cualquier cosa; inexistencia ajena al tenant → error de campo, igual que el patrón de referencias de `rentalSchema`.

## Risks / Trade-offs

- [PDFs con encoding de títulos no-ASCII] → los nombres de descarga se sanitizan a ASCII con fallback y se envía `filename*` UTF-8; el contenido del PDF usa solo glifos estándar de Helvetica (sin Unicode completo — caracteres fuera de Latin-1 se sustituyen al renderizar).
- [Storage local con archivos grandes (10 MB × N)] → límite por archivo y `UPLOAD_DIR` ya monitoreable; la migración a object storage queda encapsulada en `storage.ts`.
- [Snapshot duplica datos] → es deliberado: los contratos deben ser inmutables; el borrado del documento libera el archivo.
- [Plantilla de contrato sin revisión legal] → se documenta en el README que es una plantilla base editable externamente; no se bloquea el desarrollo por esto.
- [PGlite en dev con pdfkit] → sin impacto: pdfkit no toca la BD; la fila se escribe con Drizzle normal.

## Migration Plan

1. `npm install pdfkit` + `npm i -D @types/pdfkit`.
2. Definir `documents` en `src/db/schema.ts` y generar la migración con `npm run db:generate`; aplicar con `npm run db:migrate` (dev) / en deploy con la BD real.
3. Rollback: revert del commit + eliminación de la migración generada (es aditiva; no hay datos que perder antes del release).

## Open Questions

<!-- Ninguna: las decisiones de alcance, plantillas y permisos están resueltas arriba. -->
