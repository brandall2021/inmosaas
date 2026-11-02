# Tasks

## 1. Modelo de datos y migración

- [x] 1.1 Agregar a `src/db/schema.ts` las columnas `index_type`, `adjustment_day`, `penalty_rate` en `rentals` con tipos `RentalIndexType` exportado (`ninguno` | `icl` | `ipc` | `casa_propia` | `cer` | `uva` | `otro`).
- [x] 1.2 Agregar tablas `rental_index_entries` (alquiler, índice usado, valor base, valor nuevo, monto anterior, monto nuevo, fecha de aplicación, notas), `rental_rent_history` (alquiler, monto, fecha desde, fecha hasta) y `rental_penalties` (alquiler, monto adeudado, días de mora, tasa diaria, punitorio calculado, fecha de cálculo, estado `pendiente|pagado`, notas), con FKs por organización.
- [x] 1.3 Generar y verificar la migración Drizzle (`npm run db:generate`) y confirmar que `db:migrate` la aplica limpio sobre PGlite.

## 2. Feature `src/features/rental-indexing/` — capa de datos y acciones

- [x] 2.1 Crear `constants.ts`: tipos de índice con labels, días de ajuste, estados de punitorio, helpers de cálculo.
- [x] 2.2 Crear `data.ts` (server-only): listar ajustes por alquiler, obtener historial de canon vigente por alquiler y fecha, obtener punitorios por alquiler y estado.
- [x] 2.3 Crear helpers de cálculo: `calculateIndexAdjustment`, `calculatePenalty`.
- [x] 2.4 Crear `actions.ts` con validación: `setRentalIndexingAction` (configurar índice/día/punitorio en alquiler, owner/admin, solo vigente), `applyIndexAdjustmentAction` (registrar ajuste con cálculo sugerido, crear entrada y snapshot de historial, owner/admin), `recordPenaltyAction` (registrar punitorio, owner/admin), `markPenaltyPaidAction` (marcar pagado, owner/admin).
- [x] 2.5 Registrar en bitácora de actividad (best-effort) configuración de índice, aplicación de ajuste y registro de punitorio.

## 3. Rutas e UI

- [x] 3.1 Sección **Ajustes de índice y punitorios** en la ficha `/alquileres/[id]`: mostrar tipo de índice configurado, día de ajuste, tasa de punitorio, listado corto de ajustes y punitorios.
- [x] 3.2 Página `/alquileres/[id]/ajustes`: listado completo de ajustes aplicados y punitorios con filtros visuales.
- [x] 3.3 Página `/alquileres/[id]/ajustes/nuevo`: formulario para aplicar ajuste de índice (índice, valor base, valor nuevo, monto sugerido editable, fecha, notas) y formulario para registrar punitorio (monto adeudado, días de mora, tasa diaria, cálculo sugerido).
- [x] 3.4 Formulario de configuración de índice integrado en la ficha del alquiler (vía editar).
- [x] 3.5 Ruta de descarga de PDF no aplica para este módulo (los ajustes no generan PDF).

## 4. Cálculos y helpers

- [x] 4.1 Helper `calculateIndexAdjustment(previousAmount, baseIndex, newIndex)`: retorna `round(previousAmount * newIndex / baseIndex, 2)`.
- [x] 4.2 Helper `calculatePenalty(overdueAmount, days, dailyRate)`: retorna `round(overdueAmount * dailyRate * days / 100, 2)`.
- [x] 4.3 Helper `getRentAtDate(rentalId, date)`: retorna el monto vigente del alquiler en la fecha dada desde `rental_rent_history`.

## 5. Verificación final

- [x] 5.1 `npm run lint` y `npm run typecheck` limpios.
- [x] 5.2 `npm run build` exitoso.
- [x] 5.3 `openspec validate add-rental-indexing --strict` y walkthrough manual del circuito configurar índice → aplicar ajuste → ver historial → registrar punitorio (con datos de prueba).
