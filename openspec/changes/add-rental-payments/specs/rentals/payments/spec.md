## Purpose

Registro de cobros de alquiler por organización: cada pago se anota sobre un alquiler de la organización activa, con listado cronológico y resumen de lo cobrado frente a los meses del período.

## ADDED Requirements

### Requirement: Registro de pago sobre un alquiler

La ficha de un alquiler de la organización activa SHALL ofrecer el registro de un pago con monto mayor a cero, fecha de cobro en formato `YYYY-MM-DD`, método (efectivo, transferencia, débito, cheque, por defecto transferencia) y notas opcionales. La moneda del pago SHALL ser la del alquiler y el pago SHALL pertenecer a la organización del usuario autenticado.

#### Scenario: Pago registrado

- **WHEN** un miembro registra un pago válido de 450000 con la fecha de hoy sobre un alquiler vigente
- **THEN** el pago aparece en el listado de pagos del alquiler y el resumen acumula el total

#### Scenario: Monto inválido

- **WHEN** el registro se envía con monto vacío o igual a cero
- **THEN** se muestra un error de campo y no se crea el pago

#### Scenario: Alquiler de otra organización

- **WHEN** la acción recibe el identificador de un alquiler de otra organización
- **THEN** la operación se rechaza sin crear el pago

### Requirement: Listado cronológico de pagos

La ficha del alquiler SHALL listar sus pagos ordenados por fecha de cobro, del más reciente al más antiguo, mostrando monto, método, notas y fecha, con una acción de edición y una de eliminación con confirmación.

#### Scenario: Orden cronológico

- **WHEN** un alquiler tiene pagos en fechas distintas
- **THEN** el listado muestra primero el pago más reciente

### Requirement: Resumen de cobranza

La ficha del alquiler SHALL mostrar un resumen con el total cobrado (suma de los pagos en la moneda del alquiler), la fecha del último pago y una referencia de los meses del período que cuentan con al menos un pago registrado.

#### Scenario: Resumen después de registrar

- **WHEN** el miembro registra un segundo pago
- **THEN** el total cobrado acumula ambos montos y el último pago se actualiza con la fecha más reciente

#### Scenario: Alquiler sin pagos

- **WHEN** la ficha se abre sobre un alquiler sin pagos
- **THEN** el resumen muestra "sin cobros" y cero meses cubiertos, sin errores

### Requirement: Persistencia histórica

Los pagos SHALL conservarse cuando el alquiler cambia a los estados finalizado o rescindido, y SHALL seguir visibles y consultables desde su ficha.

#### Scenario: Alquiler finalizado conserva pagos

- **WHEN** un alquiler con pagos pasa a estado finalizado
- **THEN** la ficha sigue mostrando el historial y el total cobrado sin cambios

### Requirement: Permisos y auditoría

Cualquier miembro de la organización SHALL poder ver el historial y registrar pagos. La edición y la eliminación de un pago SHALL quedar restringidas a roles owner o admin, con confirmación antes de eliminar. Cada alta, edición y baja de pago SHALL registrar una entrada en la bitácora de actividad.

#### Scenario: Registro por miembro

- **WHEN** un miembro con rol member registra un pago
- **THEN** la operación se completa y queda registrada en la bitácora

#### Scenario: Baja solo para owner/admin

- **WHEN** un miembro sin rol de administración intenta eliminar un pago
- **THEN** la acción se rechaza y la opción de eliminación no se presenta en la ficha
