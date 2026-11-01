# Design

## Context

El módulo de pagos (`rental_payments` + `src/features/cobranzas/`) registra cobros de inquilinos con fecha, método y moneda congelada del alquiler; los pagos sobreviven al ciclo del alquiler. La infraestructura de documentos (`src/features/documentos/pdf/` con PDFKit, almacenamiento por storage key y ruta autenticada `/api/documentos`) ya genera PDFs y los registra en `documents`. La bitácora (`activityLogs`) y el control de roles (`owner | admin | member` vía DAL) son patrones transversales que este módulo reutiliza. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Cerrar el circuito básico cobro → honorarios → neto → pago al propietario, con datos editables y trazables.
- Sugerir el bruto desde los cobros reales para evitar doble digitación, sin bloquear el ingreso manual.
- Reutilizar los patrones existentes (feature directory, server actions, validación zod, bitácora, PDFKit, storage).

**Non-Goals:**

- Índices de ajuste de alquiler (ICL/UVA), escalonados y punitorios: el bruto del período se ingresa o se sugiere manualmente; el módulo queda listo para que un cambio futuro alimente el cobro con el ajuste, pero este change no toca contratos.
- "Pagos garantizados" (liquidar pague o no pague el inquilino), liquidación multi-propiedad en un solo comprobante, comisiones por venta y estados intermedios (borrador/aprobada): una liquidación directa con dos estados.
- Recibos con modelos personalizados (genérico/doble/mini): se genera un PDF técnico de liquidación, no un recibo con formatos comerciales.
- Notificaciones por email/WhatsApp ni publicación en sitios.

## Decisions

- **Liquidación anclada a un alquiler** (no directamente al propietario): el único registro de "qué se cobró" vive en `rental_payments`, por alquiler, y una liquidación por contrato refleja cómo opera una inmobiliaria. La ficha guarda `ownerClientId` (cliente de tipo `propietario`) porque hoy ni `properties` ni `rentals` tienen columna de propietario; así el cambio no modifica tablas existentes. _Alternativa considerada:_ columna `ownerId` en `properties` — más natural a futuro, pero obliga a una migración ajena a este flujo y merece su propio change.
- **Atribución del cobro al período por `paid_date`** (mes calendario de la fecha de cobro): los pagos no tienen columna de período, y agregarla cambiaría el comportamiento del módulo de cobranzas. La convención queda especificada en la spec y en el helper de sugerencia. _Alternativa considerada:_ atribuir por mes de renta (`start_date`) — requiere un mapa cobro↔mes que hoy no existe.
- **Bruto pre-sugerido, no calculado en vivo:** el monto se congela al crear la liquidación, por lo que cobros tardíos del mismo período no mutan una liquidación ya generada. Conciliar es comparar, no recalcular implícitamente.
- **`settlement_expenses` como tabla propia** (concepto, monto > 0, tipo `gasto | adicional`) en lugar de un campo JSON: los items aparecen en el PDF, permiten auditoría campo por campo y reutilizarse al crear liquidaciones de períodos futuros.
- **Honorarios como `feePercent` editable por liquidación** (default `0`), sin tabla de configuración de organización: un porcentaje por edad de datos es suficiente; una configuración global anticipa reglas que todavía no existen. _Alternativa considerada:_ `organization_settings` con porcentaje por defecto — pospuesto hasta que haya más parámetros de módulo.
- **PDF registrado como `DocumentType = "archivo"`**, regenerable: reutiliza la ruta de documentos autenticada y el listado existente sin ampliar el enum de tipos ni la spec de documents. El PDF congela los valores al generarse; la ficha avisa si quedó desactualizado y permite regenerarlo.
- **Feature en `src/features/liquidaciones/` + rutas `/liquidaciones`**: siguen el naming en español del código existente (`alquileres`, `tasaciones`) y el patrón `actions/data/constants/components` de las demás features.

## Risks / Trade-offs

- [Un cobro ya liquidado podría liquidarse de nuevo si se crea el período con un bruto editado a mano] → se mitiga con la unicidad `(rental_id, period)`: si la liquidación del período ya existe, la creación se rechaza señalándola y el helper pre-sugiere el siguiente período sin liquidación. El registro de enlaces cobro↔liquidación queda para el change de índices y ajustes.
- [El propietario vinculado puede cambiar de tipo o eliminarse desde el CRM] → FK con `set null`, validación de tipo al elegir y liquidación que sobrevive sin propietario activo (spec: Persistencia histórica).
- [Cobros posteriores a la creación no actualizan el bruto congelado] → comportamiento aceptado y documentado: el bruto es el valor declarado al liquidar; la conciliación automática es un no-goal.
- [Un PDF `archivo` se confunde con archivos de la inmobiliaria] → título normalizado `Liquidación 2026-09 — <propietario>` con link directo desde la ficha.

## Migration Plan

1. Migración Drizzle: tablas `settlements` y `settlement_expenses` con FKs por organización (`onDelete cascade` desde organizations; `set null` para propiedad, alquiler y propietario) e índice único `(rental_id, period)` sobre `settlements`.
2. Despliegue aditivo: no reescribe tablas existentes ni datos; rollback = revertir la migración (las nuevas tablas solo son referenciadas por el propio módulo).
3. Feature flag innecesario: la ruta `/liquidaciones` aparece en la nav de la app; un problema del módulo no afecta el resto de las pantallas existentes.

## Open Questions

<!-- Ninguna que cambie specs, approach o tasks: el layout del PDF y el ítem de nav se definen durante la implementación. -->
