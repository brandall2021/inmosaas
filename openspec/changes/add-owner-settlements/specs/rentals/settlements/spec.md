## Purpose

Liquidación de lo cobrado al propietario: por cada alquiler de la organización, registra el bruto cobrado del período, los honorarios de la inmobiliaria y los gastos trasladables, calcula el neto de pago y deja confirmado el pago al propietario con su comprobante PDF. Acotado a la organización activa, como el resto de los módulos.

## ADDED Requirements

### Requirement: Creación de liquidación

La organización activa SHALL permitir crear una liquidación indicando el alquiler, el propietario (cliente de tipo `propietario`), el período en formato `YYYY-MM`, el monto bruto cobrado mayor a cero y el porcentaje de honorarios entre 0 y 100, en la moneda del alquiler. La liquidación SHALL quedar en estado `pendiente` y pertenecer a la organización del usuario autenticado.

#### Scenario: Liquidación creada

- **WHEN** un miembro crea una liquidación de septiembre 2026 para el alquiler de la propiedad X con propietario, bruto 450000 y honorarios 10
- **THEN** la ficha muestra la liquidación pendiente con honorarios 45000 y neto 405000

#### Scenario: Campos inválidos

- **WHEN** la creación se envía sin propietario, con bruto menor o igual a cero, con honorarios fuera del rango o con período que no respeta `YYYY-MM`
- **THEN** se muestra el error del campo correspondiente y no se crea la liquidación

#### Scenario: Recurso de otra organización

- **WHEN** la acción recibe el identificador de un alquiler o propietario de otra organización
- **THEN** la operación se rechaza sin crear la liquidación

#### Scenario: Duplicado por alquiler y período

- **WHEN** ya existe una liquidación para el mismo alquiler del período indicado
- **THEN** la creación se rechaza y se informa la liquidación existente

### Requirement: Sugerencia del bruto desde los cobros

Al abrir el formulario de alta, el sistema SHALL pre-sugerir como monto bruto la suma de los cobros del alquiler del período indicado, atribuyendo cada pago al mes de su fecha de cobro. La sugerencia SHALL ser una pre-carga editable y SHALL NOT modificar los pagos registrados.

#### Scenario: Pre-carga con cobros atribuidos

- **WHEN** el alquiler tiene cobros por 200000 con fecha 2026-09-03, 300000 con fecha 2026-09-28 y 100000 con fecha 2026-10-05
- **THEN** para el período 2026-09 la sugerencia es 500000

#### Scenario: Período sin cobros

- **WHEN** el alquiler no tiene cobros cuya fecha de cobro caiga dentro del período elegido
- **THEN** la sugerencia es cero y el formulario no impide continuar con un bruto ingresado manualmente

### Requirement: Gastos trasladables al propietario

La liquidación pendiente SHALL permitir sumar items con concepto, monto mayor a cero y tipo `gasto` (descuenta del neto) o `adicional` (sum al neto), editarlos y eliminarlos desde su ficha. El neto SHALL recalcularse como bruto − honorarios − suma de gastos + suma de adicionales, sin aplicar punitorios ni interés en esta etapa.

#### Scenario: Detalle de gastos

- **WHEN** la liquidación pendiente con bruto 400000 y honorarios 10 suma un gasto de 20000 (expensas) y un adicional de 5000 (alquiler cochera)
- **THEN** la ficha detalla los items y el neto pasa a 345000

#### Scenario: Baja de un item

- **WHEN** el miembro elimina el gasto de expensas de la liquidación pendiente
- **THEN** el neto se recalcula sin el item y el detalle se actualiza

### Requirement: Confirmación de pago al propietario

La liquidación pendiente SHALL poder confirmarse como pagada registrando fecha de pago y método (efectivo, transferencia, débito o cheque). Una liquidación pagada SHALL quedar bloqueada en su detalle calculado: no SHALL permitir editar su bruto, período, honorarios ni items, y la operación de confirmación SHALL quedar registrada con el usuario y fecha.

#### Scenario: Liquidación pagada

- **WHEN** un owner confirma el pago de la liquidación pendiente con método transferencia y fecha de hoy
- **THEN** su estado pasa a pagada con la fecha y el método registrados, y desaparece de los filtros de pendientes

#### Scenario: Edición bloqueada después del pago

- **WHEN** la ficha de una liquidación pagada se abre para editar
- **THEN** la edición del bruto, honorarios, período e items no está disponible y el confirmar pago no vuelve a presentarse

### Requirement: Listado con filtros

El listado de liquidaciones de la organización activa SHALL ordenar las liquidaciones del período más reciente al más antiguo y SHALL filtrar por estado (todas, pendientes, pagadas) y por propietario, mostrando propietario, propiedad, período, bruto, honorarios, neto y estado.

#### Scenario: Filtro por estado

- **WHEN** el listado se filtra pendientes y una liquidación se confirma como pagada
- **THEN** la liquidación pagada deja de aparecer en el filtro pendientes y conserva su posición en el filtro todas

#### Scenario: Listado sin liquidaciones

- **WHEN** la organización no registra liquidaciones
- **THEN** el listado muestra el estado vacío con la acción de crear la primera

### Requirement: PDF de liquidación

El sistema SHALL generar un documento PDF imprimible de la liquidación con propietario, propiedad, período, bruto, honorarios, detalle de gastos y adicionales, neto, y método y fecha de pago cuando esté pagada. El PDF SHALL almacenarse en el backend de almacenamiento y SHALL registrarse como documento de tipo `archivo` vinculado al alquiler y al propietario, servido por la ruta de documentos autenticada.

#### Scenario: Generación y consulta del PDF

- **WHEN** se genera el PDF de una liquidación
- **THEN** un documento queda disponible en la ficha y es también visible en el listado de documentos de la organización

#### Scenario: PDF desactualizado revela su origen

- **WHEN** el bruto de una liquidación pendiente se edita después de haber generado su PDF
- **THEN** el PDF previo se conserva como documento histórico y la ficha permite regenerarlo con los valores actuales

### Requirement: Persistencia histórica

Las liquidaciones SHALL conservarse ante la finalización o rescisión del alquiler y el desvinculado de su propiedad o propietario, sin perder sus valores calculados ni su historial de pagos visibles en la ficha.

#### Scenario: Alquiler finalizado mantiene liquidaciones

- **WHEN** un alquiler con liquidaciones pasa a estado finalizado
- **THEN** las fichas siguen mostrando sus liquidaciones con bruto, items y neto intactos

#### Scenario: Propietario desvinculado

- **WHEN** el cliente propietario vinculado a la liquidación se elimina
- **THEN** la liquidación se conserva y la ficha muestra la relación sin propietario activo

### Requirement: Permisos y auditoría

Cualquier miembro de la organización SHALL poder ver el listado, crear liquidaciones y editar las pendientes. La confirmación de pago y la eliminación de una liquidación SHALL quedar restringidas a roles owner o admin, con confirmación previa al eliminar, y solo SHALL permitir eliminarse las pendientes. Cada alta, edición, confirmación de pago y baja SHALL registrar una entrada en la bitácora de actividad.

#### Scenario: Alta por miembro

- **WHEN** un miembro con rol member crea una liquidación y suma un gasto
- **THEN** ambas operaciones se completan y quedan registradas en la bitácora

#### Scenario: Confirmación solo para owner/admin

- **WHEN** un miembro sin rol de administración intenta confirmar el pago de una liquidación
- **THEN** la acción se rechaza y la opción de confirmación no se presenta en la ficha

#### Scenario: Eliminación de pendiente

- **WHEN** un admin elimina una liquidación pendiente tras la confirmación
- **THEN** la liquidación desaparece del listado y la baja queda registrada en la bitácora
