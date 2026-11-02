# Design

## Context

El módulo de alquileres (`rentals`) y cobranzas (`rental_payments`) manejan movimientos ligados a contratos, pero no existe un registro de ingresos y egresos sueltos (p. ej. expensas pagadas por la inmobiliaria, servicios, compras). No hay tabla de caja ni cierre de caja. La bitácora (`activityLogs`) y los roles (`owner|admin|member`) ya están disponibles. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Registrar ingresos y egresos de caja generales, con tipo, categoría, monto, moneda, fecha y vínculos opcionales a cliente/alquiler.
- Calcular y mostrar el balance acumulado (ingresos − egresos) por rango de fechas.
- Cerrar caja por fecha con monto inicial, saldo teórico, saldo real declarado y diferencia.
- Conciliar movimientos automáticamente al cerrar caja.
- Todo acotado a la organización activa.

**Non-Goals:**

- Cierre automático programado: los cierres se registran manualmente por el usuario.
- Integración con bancos o servicios de pagos externos: los montos se ingresan manualmente.
- Múltiples cajas físicas por organización: una sola caja general por organización.
- Movimientos en divisas con cotización automática: se guarda la moneda y el monto tal cual se ingresa.

## Decisions

- **Tabla `cash_box_entries` propia**: cada movimiento tiene tipo, categoría, monto, moneda, fecha, estado y vínculos opcionales. _Alternativa:_ ampliar `rental_payments` —no corresponde porque no todos los movimientos de caja están ligados a un alquiler.
- **Tabla `cash_box_closings` propia**: un cierre por organización y fecha, con monto inicial, saldo teórico, saldo real y diferencia. _Alternativa:_ campo `closed` en cada movimiento —menos trazabilidad de quién cerró y cuándo.
- **Estado `pendiente | conciliado`**: los movimientos pasan a conciliado al cerrar caja. Movimientos conciliados no se editan ni eliminan.
- **Saldo teórico calculado automáticamente** = monto inicial + ingresos − egresos del período; el saldo real lo declara el usuario y la diferencia queda registrada.
- **Rutas en español** (`/caja`, `/caja/nuevo`, `/caja/cierres`) siguiendo el naming del resto de la app.

## Risks / Trade-offs

- [Un movimiento podría registrarse con fecha futura o pasada inconsistente] → mitigado con validación de fecha no futura más allá de un margen razonable; aceptado como riesgo operativo.
- [Diferencia entre saldo teórico y real sin explicación] → el cierre obliga a notas cuando hay diferencia, para auditoría.
- [Movimientos conciliados no editables] → comportamiento intencional para integridad del cierre; corregir errores requiere un movimiento de ajuste (ingreso/egreso compensatorio).
- [Una sola caja general] -> si en el futuro se necesitan múltiples cajas, se añadiría un campo `caja_id`.

## Migration Plan

1. Migración Drizzle: tablas `cash_box_entries` y `cash_box_closings` con FKs por organización (`onDelete cascade` desde organizations; `set null` para cliente y alquiler).
2. Datos existentes: no hay datos previos; las tablas comienzan vacías.
3. Despliegue aditivo: no reescribe tablas existentes; rollback = revertir la migración.

## Open Questions

<!-- Ninguna que cambie specs, approach o tasks. -->
