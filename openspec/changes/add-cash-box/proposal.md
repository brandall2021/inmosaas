# Proposal

## Why

InmoSaaS registra cobros de inquilinos (`rental_payments`) y puede liquidar a propietarios (`settlements`), pero no tiene una **caja general** donde registrar ingresos y egresos sueltos que no estén ligados a un alquiler (p. ej. expensas pagadas por la inmobiliaria, servicios, compras de insumos, cobros diversos). Hoy esos movimientos quedan fuera del sistema, sin trazabilidad ni balances cerrados.

## What Changes

- Nueva tabla `cash_box_entries`: movimiento de caja (ingreso o egreso) con concepto, monto, moneda, fecha, tipo (`ingreso` | `egreso`), categoría, cliente/propietario/inquilino vinculado opcional, alquiler vinculado opcional, notas y estado (`pendiente` | `conciliado`).
- Nueva tabla `cash_box_closings`: cierre de caja con fecha de cierre, monto inicial, total ingresos, total egresos, saldo teórico, saldo real (declarado por el usuario), diferencia y notas. Un cierre por organización y fecha.
- Nueva sección **Caja** en `/caja`: listado de movimientos con filtros (tipo, categoría, fecha, estado), balance general, formulario de nuevo movimiento, y cierres de caja.
- Cálculo automático de saldo acumulado por fecha y conciliación de movimientos al cerrar caja.
- Permisos y auditoría: cualquier miembro registra movimientos y ve el balance; cerrar caja y conciliar movimientos restringido a owner/admin; todo queda en la bitácora de actividad.

## Capabilities

### New Capabilities

- `cash_box`: ciclo completo de caja general —registro de ingresos/egresos, listado con filtros, balance acumulado, cierre de caja con saldo teórico vs real, conciliación de movimientos— acotado a la organización activa.

### Modified Capabilities

<!-- No se modifica el comportamiento de módulos existentes; la caja es un nuevo módulo independiente. -->

## Impact

- **Base de datos**: tablas `cash_box_entries` y `cash_box_closings` + migración Drizzle (refs: `organizations`, `clients`, `rentals`, monedas `Currency`).
- **Código nuevo**: `src/features/cash-box/` (actions, data, constants, components), rutas `/caja`, `/caja/nuevo`, `/caja/cierres`, `/caja/cierres/nuevo`.
- **Modificado**: ninguno (módulo independiente).
- **Tests**: E2E de ciclo completo (registrar ingreso, registrar egreso, filtrar, ver balance, cerrar caja, conciliar, permisos).
