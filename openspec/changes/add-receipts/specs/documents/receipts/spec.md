## Purpose

Emisión de recibos formales (inquilino o propietario) vinculados a cobros y liquidaciones, con generación automática de comprobante PDF descargable y trazabilidad completa por organización.

## ADDED Requirements

### Requirement: Emisión de recibo

La organización activa SHALL permitir emitir un recibo indicando el cliente destinatario (tipo `inquilino` o `propietario`), el alquiler vinculado opcional, el período en formato `YYYY-MM`, el monto mayor a cero, la moneda, el método de pago y la fecha de emisión. El recibo SHALL quedar en estado `emitido` y pertenecer a la organización del usuario autenticado. Al emitirse, el sistema SHALL generar automáticamente su comprobante PDF.

#### Scenario: Recibos emitido con PDF

- **WHEN** un miembro emite un recibo para el inquilino "María López", alquiler de la propiedad "Depto Centro", período 2026-09, monto 450000 ARS, método transferencia, fecha de hoy
- **THEN** el recibo aparece en el listado con estado emitido y su comprobante PDF está disponible para descarga

#### Scenario: Campos inválidos

- **WHEN** la emisión se envía sin cliente, con monto menor o igual a cero, con período que no respeta `YYYY-MM` o con cliente que no es inquilino ni propietario
- **THEN** se muestra el error del campo correspondiente y no se crea el recibo

#### Scenario: Recurso de otra organización

- **WHEN** la acción recibe el identificador de un cliente o alquiler de otra organización
- **THEN** la operación se rechaza sin crear el recibo

### Requirement: Listado con filtros

El listado de recibos de la organización activa SHALL ordenar los recibos por fecha de emisión del más reciente al más antiguo y SHALL filtrar por estado (emitido, pagado, anulado), por cliente y por período, mostrando cliente, propiedad (si aplica), período, monto, moneda, método, fecha de emisión y estado.

#### Scenario: Filtro por estado y cliente

- **WHEN** el listado se filtra por estado pagado y por un cliente específico
- **THEN** solo aparecen los recibos pagados de ese cliente

#### Scenario: Listado sin recibos

- **WHEN** la organización no registra recibos
- **THEN** el listado muestra el estado vacío con la acción de emitir el primero

### Requirement: Ficha de detalle y descarga de PDF

La ficha de un recibo SHALL mostrar todos sus datos, el desglose del cálculo (monto, moneda, método) y un botón para descargar el comprobante PDF. La descarga SHALL requerir sesión y pertenencia a la organización propietaria del recibo.

#### Scenario: Descarga de comprobante

- **WHEN** un miembro solicita la descarga del PDF de un recibo de su organización
- **THEN** el sistema entrega el archivo PDF con el tipo MIME correcto y nombre de archivo sugerido

#### Scenario: Acceso ajeno denegado

- **WHEN** un usuario de otra organización intenta descargar el PDF de un recibo
- **THEN** recibe una respuesta que no revela si el archivo existe

### Requirement: Anulación de recibo

Un recibo en estado `emitido` SHALL poder anularse. Al anularse, su estado pasa a `anulado`, no SHALL poder editarse ni volverse a pagar, y la operación SHALL quedar registrada con el usuario y fecha. Un recibo ya pagado o anulado no SHALL poder anularse.

#### Scenario: Anulación de recibo emitido

- **WHEN** un admin anula un recibo en estado emitido
- **THEN** su estado pasa a anulado y deja de estar disponible para pago o nueva anulación

#### Scenario: Anulación restringida

- **WHEN** un miembro sin rol de administración intenta anular un recibo
- **THEN** la acción se rechaza y la opción de anulación no se presenta

### Requirement: Pago de recibo

Un recibo en estado `emitido` SHALL poder marcarse como pagado registrando la fecha de pago. Una vez pagado, SHALL quedar bloqueado: no SHALL permitir editar su monto, período ni método, ni anularse.

#### Scenario: Recibo pagado

- **WHEN** un miembro marca como pagado un recibo emitido con fecha de hoy
- **THEN** su estado pasa a pagado con la fecha registrada y la ficha queda bloqueada para edición y anulación

### Requirement: Persistencia histórica

Los recibos SHALL conservarse aunque el cliente vinculado sea eliminado o el alquiler finalizado o rescindido, manteniendo sus valores intactos y su historial visible en la ficha.

#### Scenario: Cliente eliminado

- **WHEN** el cliente vinculado a un recibo emitido se elimina del CRM
- **THEN** el recibo se conserva y la ficha muestra la relación sin cliente activo

### Requirement: Permisos y auditoría

Cualquier miembro de la organización SHALL poder ver el listado, emitir recibos y descargar sus PDF. La anulación y la marca de pago SHALL quedar restringidas a roles owner o admin, y cada emisión, anulación y marca de pago SHALL registrar una entrada en la bitácora de actividad.

#### Scenario: Emisión por miembro

- **WHEN** un miembro con rol member emite un recibo
- **THEN** la operación se completa y queda registrada en la bitácora

#### Scenario: Anulación solo para owner/admin

- **WHEN** un miembro sin rol de administración intenta anular un recibo
- **THEN** la acción se rechaza
