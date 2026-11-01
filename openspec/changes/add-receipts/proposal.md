# Proposal

## Why

InmoSaaS registra cobros de inquilinos (`rental_payments`) y puede liquidar lo cobrado a propietarios (`settlements`), pero no emite **recibos** —el comprobante formal que el inquilino recibe al pagar y el propietario espera al ser liquidado—. Sin recibos, cada cobro o liquidación queda sin respaldo documental imprimible, lo que es un requisito operativo básico de cualquier inmobiliaria.

## What Changes

- Nueva tabla `receipts`: recibo por cliente (inquilino o propietario), vinculado opcionalmente a un alquiler, con período (`YYYY-MM`), monto, moneda, método de pago, fecha de emisión, estado (`emitido` / `pagado` / `anulado`) y vínculo al documento PDF generado.
- Nueva sección **Recibos** en `/recibos`: listado con filtros (estado, cliente, período), ficha de detalle, emisión (genera PDF automáticamente), descarga del comprobante y anulación (solo owner/admin).
- Generación de **PDF de recibo** reutilizando la infraestructura de `documentos/pdf` (PDFKit, almacenamiento, ruta autenticada `/api/documentos`), registrado como documento de tipo `archivo` vinculado al cliente y al alquiler.
- Permisos y auditoría: cualquier miembro emite y ve recibos; anulación restringida a owner/admin; toda operación queda registrada en la bitácora de actividad.

## Capabilities

### New Capabilities

- `documents/receipts`: ciclo completo de recibos —emisión con PDF automático, listado con filtros, detalle, descarga del comprobante y anulación— acotado a la organización activa.

### Modified Capabilities

<!-- No se modifica el comportamiento de `documents`: el recibo se registra como documento de tipo `archivo` usando la infraestructura existente. -->

## Impact

- **Base de datos**: tabla `receipts` + migración Drizzle (refs: `organizations`, `clients`, `rentals`, `documents`, monedas `Currency`).
- **Código nuevo**: `src/features/receipts/` (actions, data, constants, components), rutas `/recibos`, `/recibos/nuevo`, `/recibos/[id]`, generador PDF `src/features/documentos/pdf/receipt.ts`.
- **Modificado**: ninguno (reuso de `documents`, `documentos/pdf`, `activityLogs`).
- **Tests**: E2E de ciclo completo (emitir con PDF, descargar, anular, permisos, listado).
