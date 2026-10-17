## Why

InmoSaaS administra propiedades, clientes y alquileres, pero la documentación derivada de esas operaciones vive fuera del sistema: los contratos de alquiler se redactan a mano, las propuestas comerciales se arman en documentos sueltos y los PDFs de cada negocio se guardan en carpetas dispersas. El módulo de Documentos concentra esos tres flujos dentro de la plataforma, con el mismo aislamiento multi-tenant, auditoría y permisos que el resto de los módulos.

## What Changes

- Nueva entidad `documents` (multi-tenant) que representa un documento: generado o subido, con metadatos (título, tipo, archivo, entidades vinculadas) y archivo persistido en `UPLOAD_DIR`.
- Nueva sección **Documentos** en la navegación (`/documentos`) con listado unificado, búsqueda por título y filtro por tipo (contratos, propuestas, archivos).
- **Generación de contratos de alquiler**: desde la ficha de un alquiler se genera un PDF con las partes (propietario/inquilino), inmueble, canon, período y condiciones, a partir de los datos del alquiler y de la propiedad.
- **Generación de propuestas comerciales**: desde una propiedad (y opcionalmente un cliente del CRM) se genera un PDF con datos del inmueble, precio, vigencia y notas comerciales.
- **Repositorio de archivos**: subida de documentos de oficina (PDF, DOCX, ODT, XLSX, TXT; hasta 10 MB) asociados opcionalmente a una propiedad, cliente o alquiler.
- **Descarga/visualización autenticada**: endpoint que sirve el archivo del documento solo a miembros de la organización propietaria, con `Content-Disposition` y tipo MIME correctos.
- Permisos alineados al resto de la app: cualquier miembro puede ver, generar y subir; la eliminación queda restringida a `owner`/`admin`. Toda operación registra entrada en la bitácora de actividad.

## Capabilities

### New Capabilities

- `documents`: núcleo del módulo — modelo de documento, listado y detalle en `/documentos`, descarga autenticada, permisos, eliminación (owner/admin) y auditoría.
- `documents/contracts`: generación del PDF de contrato de alquiler desde un alquiler existente, con snapshot de los datos al momento de generar.
- `documents/proposals`: generación del PDF de propuesta comercial desde una propiedad y, opcionalmente, un cliente del CRM.
- `documents/uploads`: subida de archivos PDF/Office/TXT con validación de tipo y tamaño, y su asociación opcional a propiedad, cliente o alquiler.

### Modified Capabilities

<!-- Ninguna capacidad existente cambia de requerimientos. -->

## Impact

- **Base de datos**: nueva tabla `documents` (+ migración Drizzle, relaciones con `organizations`, `rentals`, `properties`, `clients`).
- **Código nuevo**: `src/features/documentos/` (actions, data, validación, componentes), rutas en `src/app/(app)/documentos/`, endpoint `src/app/api/documentos/[...key]/`.
- **Modificados**: `src/lib/storage.ts` (almacenamiento genérico de archivos, no solo imágenes), `src/components/app-shell/nav-items.ts` (entrada "Documentos"), `src/lib/validation.ts` (esquemas del módulo).
- **Dependencias**: nueva librería de generación de PDF en el server (decisión en `design.md`).
- **Tests**: nuevo `e2e/documentos.spec.ts` (generación, subida, descarga, borrado y permisos).
