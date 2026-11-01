# Tasks

## 1. Modelo de datos y migración

- [ ] 1.1 Agregar a `src/db/schema.ts` las tablas `settlements` (org + alquiler + propietario + propiedad opcionales, período `YYYY-MM`, `grossAmount`, `feePercent`, moneda del alquiler, estado `pendiente|pagada`, `paidDate`, `paidMethod`, `notes`, timestamps) y `settlement_expenses` (concepto, monto, tipo `gasto|adicional`, FK a la liquidación con cascade), con tipos `SettlementStatus`, `PaidMethod` y `SettlementItemType` exportados.
- [ ] 1.2 Definir índices: `settlements` por organización y por `(rental_id, period)` único; `settlement_expenses` por liquidación.
- [ ] 1.3 Generar y verificar la migración Drizzle (`npm run db:generate`) y confirmar que `db:migrate` la aplica limpio sobre PGlite en desarrollo.

## 2. Feature `src/features/liquidaciones/` — capa de acciones y datos

- [ ] 2.1 Crear `constants.ts`: estados de liquidación con labels, métodos de pago reutilizados de cobranzas, formatos de período y de moneda.
- [ ] 2.2 Crear `data.ts` (server-only): listado cronológico con filtros por estado y propietario, ficha por id (scoped por organización), snapshot de items y AJAX de sugerencia del bruto cobrado por alquiler y período (sum de `rental_payments` filtrando por mes de `paid_date`).
- [ ] 2.3 Crear helpers de cálculo: honorarios, gasto sumado, adicional restado y neto = bruto − honorarios − gastos + adicionales, con redondeo a 2 decimales incluido en los escenarios de la spec.
- [ ] 2.4 Crear `actions.ts` con validación zod: `createSettlement` (rechazo de duplicado por alquiler y período, recurso de otra organización), `updateSettlement` (solo pendiente), `add/update/removeExpense` (solo pendiente), `markPaid` (owner/admin, fecha y método) y `deleteSettlement` (owner/admin, solo pendiente, con confirmación en la UI).
- [ ] 2.5 Registrar en bitácora de actividad (best-effort, patrón existente) alta, edición, ítems, confirmación de pago y baja con resumen en español.

## 3. Rutas e UI

- [ ] 3.1 Alta en la nav de `/dashboard` y layout del `(app)`: entrada `Liquidaciones` con icono (lucide) consistente con las demás.
- [ ] 3.2 Página `/liquidaciones`: tabla ordenada por período más reciente, filtros por estado (todas/pendientes/pagadas) y por propietario, estado vacío con llamada a crear la primera.
- [ ] 3.3 Página `/liquidaciones/nuevo`: selects de alquiler (con propiedad), período y propietario (tipo `propietario`), sugerencia del bruto por cobros del período, `feePercent` con default 0 y validación de campos a nivel formulario.
- [ ] 3.4 Ficha `/liquidaciones/[id]`: datos, desglose de cálculo (bruto, honorarios, items, neto), tabla de items con alta/edición/baja, acciones de editar (solo pendiente), confirmar pago (owner/admin, fecha y método), eliminar (owner/admin, pendiente) y generar/regenerar PDF con aviso si quedó desactualizado.
- [ ] 3.5 Página `/liquidaciones/[id]/editar` reutilizando el formulario de alta con edición de alquiler deshabilitada y bloqueo explícito para liquidaciones pagadas.

## 4. PDF de liquidación

- [ ] 4.1 Crear `src/features/documentos/pdf/settlement.ts` con PDFKit: encabezado, propietario, propiedad, período, tabla de bruto/honorarios, detalle de gastos y adicionales, neto destacado y línea de pago (método y fecha) si está pagada.
- [ ] 4.2 Registrar el PDF generado en `documents` con tipo `archivo`, título `Liquidación 2026-09 — <propietario>` y vínculos a alquiler y propietario, servido por la ruta de documentos existente.
- [ ] 4.3 Exponer la acción de regeneración que conserva los PDFs previos (historial) sin borrar documentos antiguos.

## 5. Dashboard

- [ ] 5.1 Añadir a las automatizaciones de configuración/dashboard la alerta `Liquidaciones pendientes` reutilizando el conteo del listado pendiente.

## 6. Tests E2E (Playwright)

- [ ] 6.1 Escenario creación: alta con sugerencia del bruto (dos cobros en 2026-09 y uno en 2026-10), honorarios 10 y verificación de neto y de rechazo de duplicado del mismo período.
- [ ] 6.2 Escenario items: alta de gasto y adicional con recálculo del neto, edición y baja con actualización del desglose.
- [ ] 6.3 Escenario pago: confirmar pago por owner (fecha y método), bloqueo de edición y desaparición del filtro pendientes; rechazo del confirmar pago para rol member.
- [ ] 6.4 Escenario permisos y aislamiento: member puede crear, no eliminar; alquiler de otra organización inaccesible; eliminación con confirmación y baja registrada en bitácora.
- [ ] 6.5 Escenario listado y PDF: filtros por estado y propietario, generación del PDF visible en ficha y en listado de documentos.

## 7. Verificación final

- [ ] 7.1 `npm run lint` y `npm run typecheck` limpios.
- [ ] 7.2 `npm run test:e2e` completo en verde.
- [ ] 7.3 Revisión de spec implementada: `openspec validate add-owner-settlements --strict` y walkthrough manual del circuito cobro → liquidar → pagar (con datos de prueba).
