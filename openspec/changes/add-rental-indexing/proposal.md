# Proposal

## Why

Los contratos de alquiler en Argentina requieren ajustes periódicos del canon por índices (ICL, IPC, Casa Propia, CER, UVA, etc.) y montos escalonados o punitorios por mora. Hoy inmosaas registra un `rent_amount` fijo por alquiler sin forma de versionar ajustes, por lo que cada cambio de índice se hace "a mano" sobre el alquiler, perdiendo el historial de cuándo y por cuánto se ajustó. Este módulo cierra esa brecha.

## What Changes

- Nueva tabla `rental_index_entries`: registro de cada ajuste de índice aplicado a un alquiler (índice usado, valor del índice en fecha base y en fecha de ajuste, monto anterior, monto nuevo, fecha de aplicación, notas). Uno o varios por alquiler.
- Nueva tabla `rental_rent_history`: snapshot histórico del canon vigente por alquiler con fecha de inicio y fin de vigencia, para consultar "cuánto se cobraba en tal mes" sin recalcular.
- Nueva tabla `rental_penalties`: registros de punitorios por mora (monto, período adeudado, fecha de cálculo, estado pagado/pendiente), vinculados al alquiler.
- Campo `index_type` en `rentals`: tipo de índice de ajuste (`ninguno` | `icl` | `ipc` | `casa_propia` | `cer` | `uva` | `otro`), nullable.
- Campo `adjustment_day` en `rentals`: día del mes en que se aplica el ajuste (1-28), nullable.
- Campo `penalty_rate` en `rentals`: tasa de punitorio por día de mora (0-100), nullable.
- Nueva sección **Ajustes de alquiler** en `/alquileres/[id]`: historial de ajustes, registrar nuevo ajuste, ver canon histórico, calcular punitorios pendientes.
- Cálculo sugerido del nuevo monto al aplicar un índice: `monto_nuevo = monto_anterior * (indice_nuevo / indice_base)`, redondeado a 2 decimales, editable antes de confirmar.
- Permisos y auditoría: cualquier miembro ve el historial; registrar ajustes y punitorios restringido a owner/admin; todo queda en la bitácora.

## Capabilities

### New Capabilities

- `rentals/indexing`: ciclo completo de ajuste de canon por índice —registrar tipo de índice y día de ajuste en el alquiler, aplicar ajustes con cálculo sugerido, conservar historial de canon vigente, calcular y registrar punitorios por mora— acotado a la organización activa.

### Modified Capabilities

<!-- `rentals/payments` no cambia su comportamiento: los pagos siguen registrando el monto pagado real; el módulo de índice solo sugiere el canon esperado. -->

## Impact

- **Base de datos**: tablas `rental_index_entries`, `rental_rent_history`, `rental_penalties` + columnas `index_type`, `adjustment_day`, `penalty_rate` en `rentals`, con migración Drizzle.
- **Código nuevo**: `src/features/rental-indexing/` (actions, data, constants, components), rutas `/alquileres/[id]/ajustes`, `/alquileres/[id]/ajustes/nuevo`.
- **Modificado**: `src/db/schema.ts` (rentals), `src/app/(app)/alquileres/[id]/page.tsx` (sección de ajustes en la ficha).
- **Tests**: E2E de ciclo completo (definir índice, aplicar ajuste, ver historial, calcular punitorio, permisos).
