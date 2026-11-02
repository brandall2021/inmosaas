## Purpose

Caja general de la organización: registro de ingresos y egresos que no están ligados a un alquiler, balance acumulado por fecha y cierre de caja con saldo teórico vs real.

## ADDED Requirements

### Requirement: Registro de movimiento de caja

La organización activa SHALL permitir registrar un movimiento de caja indicando el tipo (`ingreso` o `egreso`), el concepto, el monto mayor a cero, la moneda, la fecha, la categoría y opcionalmente un cliente y un alquiler vinculados. El movimiento SHALL quedar en estado `pendiente` y pertenecer a la organización del usuario autenticado.

#### Scenario: Ingreso registrado

- **WHEN** un miembro registra un ingreso de 20000 ARS con concepto "Venta de insumos", fecha de hoy y categoría "ventas"
- **THEN** el movimiento aparece en el listado de caja con estado pendiente y el balance acumulado se actualiza

#### Scenario: Egreso registrado

- **WHEN** un miembro registra un egreso de 5000 ARS con concepto "Compra de papelería", fecha de hoy y categoría "gastos"
- **THEN** el movimiento aparece en el listado de caja como egreso y el balance acumulado se reduce

#### Scenario: Campos inválidos

- **WHEN** el registro se envía sin concepto, con monto menor o igual a cero, sin tipo o sin fecha
- **THEN** se muestra el error del campo correspondiente y no se crea el movimiento

### Requirement: Listado con filtros

El listado de caja de la organización activa SHALL ordenar los movimientos por fecha del más reciente al más antiguo y SHALL filtrar por tipo (ingreso/egreso), categoría, rango de fechas y estado (pendiente/conciliado), mostrando fecha, concepto, tipo, monto, moneda, categoría, cliente/alquiler vinculado y estado.

#### Scenario: Filtro por tipo y estado

- **WHEN** el listado se filtra por egresos y estado conciliado
- **THEN** solo aparecen los egresos conciliados

#### Scenario: Listado vacío

- **WHEN** la organización no registra movimientos de caja
- **THEN** el listado muestra el estado vacío con la acción de registrar el primero

### Requirement: Balance acumulado

El sistema SHALL mostrar el balance general (total ingresos, total egresos, saldo neto) de la organización, calculado como suma de ingresos menos suma de egresos, considerando solo movimientos en el rango de fechas seleccionado o todos si no hay filtro.

#### Scenario: Balance con movimientos mixtos

- **WHEN** hay ingresos por 100000 y egresos por 30000
- **THEN** el balance muestra ingresos 100000, egresos 30000 y saldo neto 70000

#### Scenario: Balance sin movimientos

- **WHEN** no hay movimientos de caja
- **THEN** el balance muestra ingresos 0, egresos 0 y saldo neto 0

### Requirement: Cierre de caja

La organización activa SHALL poder cerrar caja para una fecha indicando el monto inicial y el saldo real declarado. El sistema SHALL calcular el saldo teórico (monto inicial + ingresos − egresos del período) y mostrar la diferencia entre saldo teórico y saldo real. El cierre SHALL quedar registrado con fecha, usuario y notas.

#### Scenario: Cierre cuadrado

- **WHEN** se cierra caja con monto inicial 0, saldo real igual al saldo teórico
- **THEN** el cierre muestra diferencia 0 y los movimientos del período pasan a estado conciliado

#### Scenario: Cierre con diferencia

- **WHEN** se cierra caja con saldo real distinto al saldo teórico
- **THEN** el cierre registra la diferencia y permite agregar notas explicativas

#### Scenario: Un cierre por fecha

- **WHEN** ya existe un cierre para una fecha dada
- **THEN** no se permite crear otro cierre para la misma fecha y organización

### Requirement: Conciliación de movimientos

Al cerrar caja, los movimientos `pendiente` del período SHALL pasar a estado `conciliado` automáticamente. Un movimiento conciliado SHALL no poder editarse ni eliminarse.

#### Scenario: Conciliación al cerrar

- **WHEN** se cierra caja y hay movimientos pendientes del período
- **THEN" esos movimientos pasan a estado conciliado

### Requirement: Persistencia e historial

Los movimientos de caja y los cierres SHALL conservarse históricamente. Un cierre no SHALL poder eliminarse una vez registrado. Los movimientos conciliados SHALL conservarse para consultas posteriores.

#### Scenario: Consulta histórica

- **WHEN** se consulta el listado de caja con filtro de fechas pasado
- **THEN** aparecen los movimientos y cierres de ese período

### Requirement: Permisos y auditoría

Cualquier miembro de la organización SHALL poder ver el listado, el balance y registrar movimientos. Cerrar caja y conciliar movimientos SHALL quedar restringidos a roles owner o admin. Cada alta, edición, baja de movimiento y cada cierre SHALL registrar una entrada en la bitácora de actividad.

#### Scenario: Registro por miembro

- **WHEN** un miembro con rol member registra un ingreso
- **THEN** la operación se completa y queda registrada en la bitácora

#### Scenario: Cierre solo para owner/admin

- **WHEN** un miembro sin rol de administración intenta cerrar caja
- **THEN** la acción se rechaza
