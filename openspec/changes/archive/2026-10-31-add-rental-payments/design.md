# Add Rental Payments — Design

## Context

`rentals` guarda alquileres por organización con `rentAmount`, `currency`, `status` y referencias opcionales a propiedad e inquilino. No existe ninguna tabla de cobros. La ficha de alquiler es el punto natural donde vive el registro; el módulo comparte el patrón `features/<modulo>` (actions + data + componentes) del resto de la app.

## Goals / Non-Goals

- **Goals**: registrar cobros manuales con historial y resumen por alquiler; permisos owner/admin para editar/borrar; auditoría en bitácora; alineación con el resto de los módulos (error de campo legible, redirect después de la acción).
- **Non-Goals**: facturación, plan de cuotas con vencimientos automáticos, recordatorios de pago, impresión de recibos, integración con pasarelas de pago.

## Decisions

- **Nueva tabla `rental_payments`**: `id`, `organizationId` (FK, índice con `rentalId`), `rentalId` (FK), `amount` numeric(14,2), `currency` (heredada del alquiler al crear, luego congelada en el pago), `paidDate` (date, `YYYY-MM-DD`), `method` (enum simple con text), `notes`, timestamps. Decimal igual que en `rentals` (`mode: "number"`).
- **Snapshot de moneda**: el pago copia la moneda del alquiler en el momento del registro (no cambia si luego editan el alquiler).
- **Resumen en una sola consulta**: agregación SQL (`sum`, `max(paidDate)`) en la capa `data` para no traer todo el historial al renderizar el resumen.
- **Meses cubiertos**: comparación en TypeScript de los meses (año-mes) cubiertos por pagos contra los meses del período del alquiler entre `startDate` y `endDate`; presentado como conteo. No intenta conciliar fracciones ni montos parciales.
- **Validación Zod** compartida con `action-state`; acciones server-side reutilizan el guard de pertenencia al tenant del resto de las features.
- **Bitácora**: log con la misma convención de acciones best-effort de las demás features.
- **UI**: sección nueva en la ficha de alquiler con bloque de resumen arriba, tabla cronológica y botón "Registrar pago" que abre el formulario inline de la misma página (Server Action + redirect a la ficha).

## Open Questions

- ¿Envío de recibo por email? Fuera de alcance (no hay SMTP configurado en el proyecto).
