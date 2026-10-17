## Purpose

Núcleo del módulo de Documentos: modelo de documento multi-tenant, listado y detalle en `/documentos`, descarga autenticada del archivo, permisos de eliminación y auditoría de operaciones.

## ADDED Requirements

### Requirement: Modelo de documento multi-tenant

Cada documento SHALL pertenecer a la organización activa del usuario que lo creó, con título, tipo (`contrato_alquiler`, `propuesta` o `archivo`), archivo asociado (clave de almacenamiento, tipo MIME y tamaño) y hasta tres vínculos opcionales: una propiedad, un cliente y un alquiler de la misma organización. Al eliminar una entidad vinculada, el documento SHALL permanecer y su vínculo quedará vacío.

#### Scenario: Documento aislado por tenant

- **WHEN** un usuario de la organización A crea un documento y un usuario de la organización B lista sus documentos
- **THEN** el documento de A no aparece en el listado de B ni es accesible por su detalle o descarga

#### Scenario: Entidad vinculada eliminada

- **WHEN** se elimina un alquiler que estaba vinculado a un documento
- **THEN** el documento sigue existiendo y el vínculo al alquiler queda sin asignar

### Requirement: Listado y búsqueda en /documentos

El sistema SHALL ofrecer en `/documentos` un listado de los documentos de la organización con búsqueda por título y filtro por tipo, mostrando por cada documento su título, tipo, fecha de creación, tamaño, estado de los vínculos y un enlace a su detalle. El acceso SHALL requerir sesión iniciada; sin sesión se redirige a `/login`.

#### Scenario: Listado del tenant activo

- **WHEN** un miembro autenticado visita `/documentos`
- **THEN** ve solo los documentos de su organización activa, ordenados de más reciente a más antiguo

#### Scenario: Búsqueda y filtro por tipo

- **WHEN** el usuario escribe un término en el buscador y/o selecciona un tipo de documento
- **THEN** el listado muestra únicamente los documentos cuyo título contiene el término y coinciden con el tipo filtrado

#### Scenario: Sin sesión

- **WHEN** un usuario sin cookie de sesión visita `/documentos`
- **THEN** es redirigido a `/login`

### Requirement: Descarga autenticada del archivo

El sistema SHALL servir el archivo de un documento a través de un endpoint que verifique sesión y pertenencia a la organización propietaria del documento, respondiendo con el tipo MIME correcto y un nombre de archivo sugerido para la descarga. Un usuario sin sesión SHALL recibir `401`; un usuario de otra organización o una clave inexistente SHALL recibir `404` sin revelar si el archivo existe en otro tenant.

#### Scenario: Miembro descarga un documento propio

- **WHEN** un miembro autenticado de la organización solicita la descarga de un documento de su organización
- **THEN** recibe el archivo con su tipo MIME y nombre de descarga correctos

#### Scenario: Acceso de otro tenant

- **WHEN** un usuario autenticado de otra organización solicita la clave de un documento ajeno
- **THEN** recibe `404`

#### Scenario: Sin sesión

- **WHEN** una petición sin cookie de sesión solicita la descarga
- **THEN** recibe `401`

### Requirement: Ficha de detalle con descarga

El detalle del documento (`/documentos/[id]`) SHALL mostrar título, tipo, fecha de creación, tamaño, los vínculos a propiedad/cliente/alquiler (con enlace a sus fichas cuando existan) y un botón de descarga del archivo. El acceso SHALL estar limitado a miembros de la organización.

#### Scenario: Detalle con vínculos

- **WHEN** un miembro abre la ficha de un documento vinculado a un alquiler de su organización
- **THEN** ve los metadatos, el enlace al alquiler correspondiente y el botón de descarga

### Requirement: Eliminación restringida a owner/admin

La eliminación de un documento SHALL estar disponible solo para roles `owner` y `admin`, eliminar la fila y su archivo de almacenamiento, y redirigir al listado. Los usuarios `member` SHALL NOT poder eliminar documentos, ni siquiera invocando la acción directamente.

#### Scenario: Owner elimina un documento

- **WHEN** un `owner` confirma la eliminación de un documento
- **THEN** el documento y su archivo desaparecen del listado y el sistema queda en el listado `/documentos`

#### Scenario: Member intenta eliminar

- **WHEN** un usuario `member` intenta ejecutar la eliminación de un documento
- **THEN** la operación no tiene efecto y el documento permanece

### Requirement: Auditoría de operaciones

Crear un documento (por subida o generación) y eliminarlo SHALL registrar una entrada en la bitácora de actividad de la organización, de forma best-effort: si el registro falla, la operación principal SHALL NOT fallar.

#### Scenario: Auditoría al eliminar

- **WHEN** un `admin` elimina un documento
- **THEN** la bitácora de la organización muestra quién eliminó qué documento y cuándo
