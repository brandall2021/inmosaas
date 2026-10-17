## Purpose

Generación del PDF de una propuesta comercial a partir de una propiedad del portafolio, con destinatario opcional (cliente del CRM), vigencia y mensaje comercial.

## ADDED Requirements

### Requirement: Generación de la propuesta desde una propiedad

La ficha de una propiedad SHALL ofrecer un botón "Generar propuesta" (visible para cualquier miembro) que abre un formulario con: destinatario opcional (un cliente de la organización), fecha de vigencia opcional y mensaje/notas comerciales opcionales. Al enviarla, el sistema crea un PDF con los datos del inmueble (título, dirección, ciudad, tipo, superficie, operación y precio con moneda), el destinatario cuando exista, la vigencia y el mensaje.

#### Scenario: Propuesta con destinatario

- **WHEN** el miembro genera una propuesta seleccionando un cliente, con vigencia y mensaje
- **THEN** el PDF contiene el inmueble, el cliente, la fecha de vigencia y el mensaje ingresado

#### Scenario: Propuesta genérica sin cliente

- **WHEN** el miembro genera una propuesta sin seleccionar cliente ni vigencia
- **THEN** el PDF se crea con los bloques de destinatario y vigencia marcados como no informados

### Requirement: Validación del formulario de propuesta

El formulario SHALL validar en el servidor que el cliente seleccionado (si lo hay) pertenezca a la organización activa y que la fecha de vigencia, cuando se informe, sea un `YYYY-MM-DD` válido. Los errores SHALL mostrarse por campo sin crear documento.

#### Scenario: Cliente de otra organización

- **WHEN** el formulario recibe el identificador de un cliente ajeno
- **THEN** se muestra un error de campo y no se genera el documento

#### Scenario: Fecha de vigencia inválida

- **WHEN** la vigencia no tiene formato de fecha válido
- **THEN** se muestra un error de campo y el formulario conserva los demás datos

### Requirement: Almacenamiento y trazabilidad de la propuesta

La propuesta generada SHALL guardarse como documento de tipo `propuesta` con vínculo a la propiedad (y al cliente cuando exista), quedar descargable desde `/documentos` y la ficha de la propiedad, y registrar auditoría de la generación.

#### Scenario: Propuesta visible y descargable

- **WHEN** la generación termina correctamente
- **THEN** la propuesta aparece en el listado de documentos con su vínculo a la propiedad y la descarga devuelve el PDF generado

#### Scenario: Auditoría de generación

- **WHEN** un miembro genera una propuesta
- **THEN** la bitácora registra quién generó la propuesta de qué propiedad
