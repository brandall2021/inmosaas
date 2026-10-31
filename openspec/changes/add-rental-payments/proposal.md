# Add Rental Payments

## Why

Los alquileres registran canon, período y estado, pero no hay forma de anotar cobros: la facturación se lleva fuera de la plataforma y no es posible saber cuánto se cobró de un alquiler ni cuándo fue el último pago. El módulo de Cobranzas suma el registro de pagos sobre cada alquiler sin un sistema de facturación completo.

## What Changes

- Nueva tabla multi-tenant `rental_payments` (alquiler, monto, moneda heredada del alquiler, fecha de cobro, método, notas).
- Nueva sección **Pagos** en la ficha de alquiler con: registro de pago, listado cronológico, edición y baja.
- **Resumen de cobranzas** por alquiler: total cobrado, último pago y referencia de los meses del período que tienen al menos un pago registrado.
- Persistencia histórica: la baja del alquiler (estado `finalizado`/`rescindido`) conserva el historial de pagos consultable.
- Permisos alineados al resto de la app: cualquier miembro puede ver y registrar pagos; la edición y la baja quedan restringidas a `owner`/`admin` con confirmación al eliminar. Toda operación registra entrada en la bitácora.

## Capabilities

### New Capabilities

- `rentals/payments`: registro, listado, resumen de cobros por alquiler, permisos y auditoría.

### Modified Capabilities

<!-- El módulo de alquileres had no spec previa; su ficha gana la sección de Pagos descrita aquí. -->

## Impact

- **Base de datos**: nueva tabla `rental_payments` + migración Drizzle.
- **Código nuevo**: `src/features/cobranzas` (acciones, consultas, componentes) y sección "Pagos" en `src/app/(app)/alquileres/[id]`.
- **Modificado**: ficha de alquiler (resumen y tabla de pagos), `src/components/app-shell/nav-items.ts` queda igual (los pagos viven dentro del alquiler).
- **Tests**: nuevo `e2e/pagos.spec.ts` (registro, listado, resumen, edición, baja y permisos).
