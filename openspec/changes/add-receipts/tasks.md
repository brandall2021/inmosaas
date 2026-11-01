# Tasks

## 1. Modelo de datos y migración

- [x] 1.1 Agregar a `src/db/schema.ts` la tabla `receipts` (org + cliente + alquiler opcional + documento opcional, período `YYYY-MM`, monto, moneda, método de pago, fecha de emisión, fecha de pago, estado `emitido|pagado|anulado`, notas, timestamps) con tipos `ReceiptStatus`, `ReceiptMethod` exportados.
- [x] 1.2 Definir índices: `receipts` por organización, por cliente y por `(organization_id, client_id, period)` para consultas rápidas.
- [x] 1.3 Generar y verificar la migración Drizzle (`npm run db:generate`) y confirmar que `db:migrate` la aplica limpio sobre PGlite.

## 2. Feature `src/features/receipts/` — capa de datos y acciones

- [x] 2.1 Crear `constants.ts`: estados de recibo con labels, métodos de pago, formato de período.
- [x] 2.2 Crear `data.ts` (server-only): listado cronológico con filtros por estado/cliente/período, ficha por id (scoped por organización), conteo de recibos por estado.
- [x] 2.3 Crear helpers de cálculo: monto, moneda, método, fecha de pago si aplica.
- [x] 2.4 Crear `actions.ts` con validación zod: `createReceiptAction` (validar cliente tipo inquilino/propietario, alquiler de la misma org, generar PDF automático y registrar documento), `markReceiptPaidAction` (owner/admin, fecha de pago), `voidReceiptAction` (owner/admin, solo emitido), `deleteReceiptAction` (owner/admin, solo emitido).
- [x] 2.5 Registrar en bitácora de actividad (best-effort) alta, anulación, marca de pago y eliminación.

## 3. Generador PDF de recibo

- [x] 3.1 Crear `src/features/documentos/pdf/receipt.ts` con PDFKit: encabezado (InmoSaaS, organización), cliente destinatario, alquiler (si aplica), período, monto, moneda, método de pago, fecha de emisión, fecha de pago si aplica, notas.
- [x] 3.2 Integrar en `createReceiptAction`: generar PDF, guardarlo con `saveDocumentFile`, registrar en `documents` como tipo `archivo` con título `Recibo 2026-09 — <cliente>`, vinculado a cliente y alquiler, guardar `document_id` en el recibo.

## 4. Rutas e UI

- [x] 4.1 Alta en la nav del layout: entrada `Recibos` con icono (lucide) consistente.
- [x] 4.2 Página `/recibos`: tabla ordenada por fecha de emisión más reciente, filtros por estado (emitido/pagado/anulado), cliente y período, estado vacío con llamada a emitir el primero.
- [x] 4.3 Página `/recibos/nuevo`: formulario con selects de cliente (tipo inquilino/propietario), alquiler (filtrado por org), período, monto, moneda, método, fecha de emisión; validación de campos.
- [x] 4.4 Ficha `/recibos/[id]`: datos del recibo, desglose, botón de descarga del PDF, acciones de marcar como pagado y anular (owner/admin, solo emitido), eliminar (owner/admin, solo emitido).
- [x] 4.5 Ruta de descarga de PDF: reutilizar la existente `/api/documentos/[...key]` con verificación de sesión y organización.

## 5. Dashboard

- [ ] 5.1 Añadir a las automatizaciones de configuración el conteo de recibos emitidos pendientes de pago (opcional, según espacio en el dashboard).

## 6. Tests E2E (Playwright)

- [ ] 6.1 Escenario emisión: alta de recibo para inquilino con alquiler, verificación de PDF generado y disponible, estado emitido.
- [ ] 6.2 Escenario descarga: descargar el PDF del recibo y verificar que es accesible.
- [ ] 6.3 Escenario pago y anulación: marcar como pagado (owner), verificar bloqueo de edición; anular (admin), verificar que no se puede pagar ni anular dos veces; rechazo para rol member.
- [ ] 6.4 Escenario permisos y aislamiento: miembro de otra organización no puede ver ni descargar recibos; cliente de otra org no seleccionable.
- [ ] 6.5 Escenario listado y filtros: filtros por estado, cliente y período funcionan correctamente.

## 7. Verificación final

- [x] 7.1 `npm run lint` y `npm run typecheck` limpios.
- [x] 7.2 `npm run build` exitoso.
- [x] 7.3 `openspec validate add-receipts --strict` y walkthrough manual del circuito emitir → pagar → anular (con datos de prueba).
