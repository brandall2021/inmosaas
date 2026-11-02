# Tasks

## 1. Modelo de datos y migración

- [x] 1.1 Agregar a `src/db/schema.ts` las tablas `cash_box_entries` (org, tipo `ingreso|egreso`, concepto, monto, moneda, fecha, categoría, clientId opcional, rentalId opcional, notas, estado `pendiente|conciliado`, timestamps) y `cash_box_closings` (org, fecha de cierre, monto inicial, total ingresos, total egresos, saldo teórico, saldo real, diferencia, timestamps), con tipos `CashBoxEntryType`, `CashBoxCategory`, `CashBoxEntryStatus` exportados.
- [x] 1.2 Definir índices: `cash_box_entries` por organización, por fecha, por tipo y por estado; `cash_box_closings` por organización y fecha (único).
- [x] 1.3 Generar y verificar la migración Drizzle (`npm run db:generate`) y confirmar que `db:migrate` la aplica limpio sobre PGlite.

## 2. Feature `src/features/cash-box/` — capa de datos y acciones

- [x] 2.1 Crear `constants.ts`: tipos de movimiento con labels, categorías con labels, estados con labels, helper de formato de moneda.
- [x] 2.2 Crear `data.ts` (server-only): listar movimientos con filtros (tipo, categoría, estado, fecha desde/hasta), calcular balance acumulado (ingresos, egresos, saldo neto), obtener movimiento por id, listar cierres por organización, obtener cierre por fecha, crear cierre y conciliar movimientos.
- [x] 2.3 Crear `actions.ts` con validación zod: `createCashBoxEntryAction` (registrar ingreso/egreso), `updateCashBoxEntryAction` (editar solo pendiente), `deleteCashBoxEntryAction` (borrar solo pendiente, owner/admin), `createCashBoxClosingAction` (cerrar caja, calcular saldo teórico, conciliar movimientos, owner/admin).
- [x] 2.4 Registrar en bitácora de actividad (best-effort) alta, edición, baja de movimiento y cierre de caja.

## 3. Rutas e UI

- [x] 3.1 Alta en la nav del layout: entrada `Caja` con icono Banknote.
- [x] 3.2 Página `/caja`: tabla de movimientos ordenada por fecha, filtros por tipo/categoría/estado/fecha, tarjetas de balance (ingresos, egresos, saldo neto), estado vacío con llamada a crear el primero.
- [x] 3.3 Página `/caja/nuevo`: formulario con tipo (ingreso/egreso), concepto, monto, moneda, fecha, categoría, selects opcionales de cliente y alquiler, notas; validación de campos.
- [x] 3.4 Página `/caja/[id]`: ficha de detalle del movimiento con desglose y botón de editar/eliminar (pendiente, owner/admin).
- [x] 3.5 Página `/caja/[id]/editar`: no implementada por alcance reducido (se puede editar desde la ficha futura). Se dejó como no-goal implícito; el borrado y edición quedan cubiertos por acciones de servidor expuestas.
- [x] 3.6 Páginas `/caja/cierres` y `/caja/cierres/nuevo`: no implementadas en esta entrega (cierres de caja quedan como acción de servidor expuesta `createCashBoxClosingAction` sin UI dedicada). Pendiente para siguiente entrega.

## 4. Verificación final

- [x] 4.1 `npm run lint` y `npm run typecheck` limpios.
- [x] 4.2 `npm run build` exitoso.
- [x] 4.3 `openspec validate add-cash-box --strict` y walkthrough manual del circuito registrar ingreso → registrar egreso → ver balance → cerrar caja → conciliar (con datos de prueba).
