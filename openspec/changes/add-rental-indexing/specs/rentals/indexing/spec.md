## Purpose

Registro de ajustes de canon de alquiler por índice (ICL, IPC, UVA, etc.), historial del monto vigente y cálculo de punitorios por mora, para que cada alquiler tenga trazabilidad de cuánto se cobraba y cuándo cambió.

## ADDED Requirements

### Requirement: Definir índice de ajuste en un alquiler

La organización activa SHALL permitir configurar en un alquiler el tipo de índice de ajuste (`ninguno`, `icl`, `ipc`, `casa_propia`, `cer`, `uva`, `otro`), el día del mes de aplicación (1-28) y la tasa de punitorio por día de mora (0-100). Estos campos SHALL ser opcionales y editables mientras el alquiler esté vigente.

#### Scenario: Configurar índice en alquiler vigente

- **WHEN** un owner edita un alquiler vigente y selecciona índice `icl`, día de ajuste 12 y punitorio 2% diario
- **THEN** la ficha del alquiler muestra esos valores y los siguientes cobros los usan como referencia

#### Scenario: Índice en alquiler finalizado

- **WHEN** se intenta editar el tipo de índice de un alquiler `finalizado`
- **THEN** la edición se rechaza y los campos quedan bloqueados

### Requirement: Historial de canon vigente

El sistema SHALL conservar un snapshot del canon vigente por alquiler con fecha de inicio y fin de vigencia, cada vez que se aplica un ajuste o se crea el alquiler. SHALL ser consultable para saber el monto que regía en cualquier fecha.

#### Scenario: Crear snapshot inicial

- **WHEN** se crea un alquiler con canon 450000 desde el 2026-01-01
- **THEN** existe un registro de historial con monto 450000 vigente desde 2026-01-01

#### Scenario: Nuevo snapshot al ajustar

- **WHEN** se aplica un ajuste que cambia el canon de 450000 a 480000 a partir de 2026-09-01
- **THEN** el snapshot anterior cierra su vigencia en 2026-08-31 y se crea uno nuevo con monto 480000 desde 2026-09-01

### Requirement: Aplicar ajuste de índice

La organización activa SHALL poder registrar un ajuste de índice sobre un alquiler indicando el índice usado, el valor del índice en la fecha base y el valor del índice en la fecha de ajuste. El sistema SHALL sugerir el nuevo monto como `monto_anterior * (indice_nuevo / indice_base)` redondeado a 2 decimales, y el usuario SHALL poder editarlo antes de confirmar. El ajuste SHALL crear un registro en `rental_index_entries` y actualizar el historial de canon.

#### Scenario: Ajuste con cálculo sugerido

- **WHEN** se registra un ajuste ICL con índice base 1000 y índice nuevo 1050 sobre un alquiler con canon 450000
- **THEN** el sistema sugiere 472500 como nuevo monto y, al confirmar, crea el registro de ajuste y actualiza el historial

#### Scenario: Monto editado antes de confirmar

- **WHEN** el usuario cambia el monto sugerido de 472500 a 475000 antes de confirmar el ajuste
- **THEN** el registro guarda 475000 como monto nuevo y el historial refleja ese valor

#### Scenario: Recurso de otra organización

- **WHEN** la acción recibe el id de un alquiler de otra organización
- **THEN** la operación se rechaza sin crear el ajuste

### Requirement: Listado de ajustes por alquiler

La ficha de un alquiler SHALL listar sus ajustes de índice ordenados por fecha de aplicación del más reciente al más antiguo, mostrando índice, valor base, valor nuevo, monto anterior, monto nuevo, fecha y notas.

#### Scenario: Orden cronológico inverso

- **WHEN** un alquiler tiene dos ajustes en fechas distintas
- **THEN** el listado muestra primero el más reciente

### Requirement: Cálculo y registro de punitorios por mora

El sistema SHALL permitir calcular punitorios para un alquiler con pagos pendientes: indicando el monto adeudado, los días de mora y la fecha de cálculo, SHALL sugerir el punitorio como `monto_adeudado * tasa_diaria * dias_mora` y registrarlo en `rental_penalties` con estado `pendiente`. Una vez pagado, SHALL poder marcarse como `pagado`.

#### Scenario: Calcular punitorio

- **WHEN** se registra un punitorio de 50000 adeudado con 10 días de mora y tasa 2% diario sobre un alquiler con penalty_rate 2
- **THEN** el sistema sugiere 10000 como punitorio y lo registra como pendiente

#### Scenario: Marcar punitorio como pagado

- **WHEN** un admin marca un punitorio pendiente como pagado
- **THEN** su estado pasa a pagado y queda bloqueado para edición

#### Scenario: Solo owner/admin registra punitorios

- **WHEN** un miembro sin rol de administración intenta registrar un punitorio
- **THEN** la acción se rechaza

### Requirement: Permisos y auditoría

Cualquier miembro de la organización SHALL poder ver el historial de ajustes y punitorios. Registrar ajustes, aplicar cambios de canon y registrar/marcar punitorios SHALL quedar restringidos a roles owner o admin. Cada operación SHALL registrar una entrada en la bitácora de actividad.

#### Scenario: Miembro ve historial

- **WHEN** un miembro abre la ficha de un alquiler con ajustes
- **THEN** puede ver el listado de ajustes y el historial de canon

#### Scenario: Solo owner/admin aplica ajuste

- **WHEN** un miembro sin rol de administración intenta registrar un ajuste de índice
- **THEN** la acción se rechaza
