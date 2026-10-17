# documents/contracts Specification

## Purpose

Generación del PDF de un contrato de alquiler a partir de un alquiler existente, con los datos del negocio copiados al documento en el momento de generarse.

## Requirements

### Requirement: Generación del contrato desde un alquiler

La ficha de un alquiler SHALL ofrecer un botón "Generar contrato" (visible para cualquier miembro) que crea un PDF con: la organización emisora, los datos del inmueble (dirección, ciudad, superficie), los datos del inquilino cuando el alquiler tiene cliente asignado, el canon mensual con su moneda, el período (inicio y fin) y un campo opcional de condiciones adicionales ingresado al generar. Los bloques de datos faltantes (por ejemplo, alquiler sin propiedad o sin inquilino) SHALL quedar marcados como no informados en el PDF, sin bloquear la generación.

#### Scenario: Contrato con datos completos

- **WHEN** un miembro genera el contrato de un alquiler que tiene propiedad e inquilino asignados
- **THEN** el PDF contiene la organización, el inmueble, el inquilino, el canon, el período y las condiciones adicionales ingresadas

#### Scenario: Alquiler sin inquilino

- **WHEN** se genera el contrato de un alquiler sin cliente asignado
- **THEN** el PDF se crea con el bloque del inquilino marcado como no informado

#### Scenario: Condiciones adicionales vacías

- **WHEN** se genera el contrato sin completar condiciones adicionales
- **THEN** el PDF se crea correctamente sin esa sección

### Requirement: Snapshot inmutable de los datos

Los datos del alquiler y la propiedad SHALL copiarse al PDF al momento de generar; editar el alquiler o la propiedad después SHALL NOT alterar los documentos ya generados. Cada generación crea un documento nuevo (no sobrescribe los anteriores), conservando el historial de contratos del alquiler.

#### Scenario: Edición posterior al alquiler

- **WHEN** después de generar un contrato se modifica el canon del alquiler
- **THEN** el contrato ya generado conserva el canon con el que fue generado y un nuevo contrato refleja el importe actualizado

#### Scenario: Regenerar contrato

- **WHEN** el miembro vuelve a generar el contrato del mismo alquiler
- **THEN** aparece un segundo documento en el listado, sin modificar el primero

### Requirement: Almacenamiento del contrato generado

Al generar, el sistema SHALL guardar el PDF como documento de tipo `contrato_alquiler`, con título derivado del alquiler, vínculo al mismo y archivo descargable desde la ficha y el listado de documentos. La operación SHALL registrar auditoría y fallar de forma legible si el archivo no puede persistirse, sin dejar fila sin archivo.

#### Scenario: Documento generado visible

- **WHEN** la generación termina correctamente
- **THEN** el contrato aparece en `/documentos` filtrando por tipo "Contratos", vinculado al alquiler, y su descarga devuelve el PDF generado

#### Scenario: Auditoría de generación

- **WHEN** un miembro genera un contrato
- **THEN** la bitácora de la organización registra quién generó el contrato de qué alquiler
