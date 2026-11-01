# Add Owner Settlements

## Why

La plataforma registra cobros de alquileres (`rental_payments`) pero no existe la contracara: la **liquidación de lo cobrado al propietario**. Para una inmobiliaria es el flujo central de administración (cobro del inquilino → honorarios → pago al propietario) y hoy queda cortado en la etapa del cobro, con la deuda al propietario solo visible en otra herramienta.

## What Changes

- Nueva tabla `settlements`: liquidación por propietario + alquiler + período (`YYYY-MM`), con monto bruto cobrado, porcentaje de honorarios, gastos trasladables y neto calculado, moneda, estado (`pendiente` / `pagada`), fecha y método de pago.
- Nueva tabla `settlement_expenses`: detalle de gastos/adicionales trasladables al propietario dentro de una liquidación (concepto, monto, tipo `gasto` o `adicional`), con corrección de la liquidación al editarlos.
- Monto bruto **pre-sugerido** desde los cobros del alquiler en el período (atribución por `paid_date`), siempre editable en la ficha.
- Nueva sección **Liquidaciones** en `/liquidaciones`: listado con filtros (todas / pendientes / pagadas / por propietario), ficha con detalle, edición y confirmación de pago.
- Generación de **PDF imprimible** de la liquidación reutilizando la infraestructura de documentos (`documents/pdf`), registrado como documento `archivo` vinculado al alquiler.
- Permisos y auditoría alineados con el módulo de pagos: alta/edición para cualquier miembro, pago y eliminación restringidos a owner/admin, todo registrado en la bitácora.

## Capabilities

### New Capabilities

- `rentals/settlements`: ciclo completo de liquidación al propietario — creación con período y alquiler, sugerencia del bruto desde los cobros, honorarios y gastos trasladables, cálculo del neto, confirmación de pago, listado con filtros y documento PDF imprimible, acotado a la organización activa.

### Modified Capabilities

<!-- No cambia el comportamiento de `rentals/payments`: la sugerencia del bruto solo lee cobros existentes. El PDF reutiliza la infraestructura de `documents`, sin alterar sus requisitos. -->

## Impact

- **Base de datos**: tablas `settlements` y `settlement_expenses` + migración Drizzle (refs: `organizations`, `rentals`, `clients`, monedas `Currency`).
- **Código nuevo**: `src/features/liquidaciones/` (actions, data, constants, components), rutas `/liquidaciones`, `/liquidaciones/nuevo`, `/liquidaciones/[id]` y `/liquidaciones/[id]/editar`, generador PDF `settlement.ts`.
- **Modificado**: `src/features/documentos/pdf/` (reuso de utilidades de documento) y `src/app/(app)/dashboard` (alerta de liquidaciones pendientes junto a las automatizaciones).
- **Tests**: E2E de ciclo completo (crear con sugerencia, gastos, confirmar pago, permisos, listado, PDF).
- **No afecta**: contratos, pagos de inquilinos ni documentos existentes.
