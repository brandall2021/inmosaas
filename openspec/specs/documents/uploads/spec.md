# documents/uploads Specification

## Purpose

Subida de archivos de oficina (PDF, DOCX, ODT, XLSX, TXT) al repositorio de documentos de la organización, con validación de tipo y tamaño y asociación opcional a una propiedad, cliente o alquiler propio.

## Requirements

### Requirement: Tipos y tamaño permitidos

El sistema SHALL aceptar únicamente archivos PDF, DOCX, ODT, XLSX y TXT de hasta 10 MB en la subida, validando la extensión del archivo contra su tipo declarado. Un archivo con extensión no permitida o excedido el tamaño SHALL rechazarse con un error de campo legible, sin crear documento ni archivo.

#### Scenario: Subida de un PDF válido

- **WHEN** un miembro sube un archivo `.pdf` de menos de 10 MB con título
- **THEN** se crea el documento tipo `archivo` y su archivo queda disponible para descarga

#### Scenario: Extensión no permitida

- **WHEN** el usuario intenta subir un archivo `.exe`
- **THEN** el formulario muestra un error de campo indicando los tipos permitidos y no se crea ningún documento

#### Scenario: Archivo demasiado grande

- **WHEN** el usuario intenta subir un PDF de más de 10 MB
- **THEN** el formulario muestra un error de campo por tamaño máximo y no se crea ningún documento

### Requirement: Asociación opcional a entidades

El formulario de subida SHALL permitir vincular el archivo, de forma opcional, a una propiedad, un cliente o un alquiler de la organización activa. Referencias a entidades que no existan o pertenezcan a otra organización SHALL rechazarse con error de campo.

#### Scenario: Subida vinculada a un alquiler propio

- **WHEN** el usuario sube un PDF seleccionando uno de sus alquileres en el campo de vínculo
- **THEN** el documento creado queda vinculado a ese alquiler y aparece en su ficha

#### Scenario: Referencia ajena al tenant

- **WHEN** la acción recibe el identificador de un cliente de otra organización
- **THEN** la operación se rechaza con error de campo y no se crea el documento

### Requirement: Subida desde /documentos

La página `/documentos/nuevo` SHALL ofrecer un formulario con título obligatorio, campo de archivo y selects opcionales de propiedad, cliente y alquiler (poblados con entidades de la organización). En éxito, el sistema SHALL redirigir a la ficha del documento creado; en error de validación, los mensajes SHALL mostrarse por campo.

#### Scenario: Alta exitosa

- **WHEN** el miembro completa título y archivo válidos y envía el formulario
- **THEN** es redirigido a `/documentos/[id]` del documento recién creado

#### Scenario: Sin archivo

- **WHEN** el formulario se envía sin seleccionar archivo
- **THEN** se muestra un error de campo y el formulario permanece con los datos ingresados
