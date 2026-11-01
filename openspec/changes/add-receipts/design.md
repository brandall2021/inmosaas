# Design

## Context

El módulo de documentos (`src/features/documentos/`) ya tiene infraestructura para generar PDF con PDFKit, almacenar archivos en `.uploads` y servirlos por la ruta autenticada `/api/documentos/[...key]`, verificando sesión y pertenencia a la organización. El módulo de cobranzas (`rental_payments`) registra pagos de inquilinos y el de liquidaciones (`settlements`) paga a propietarios, pero ninguno emite comprobante formal. La bitácora (`activityLogs`) y los roles (`owner|admin|member`) son transversales. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Emitir recibos formales con PDF automático, vinculados a cliente y opcionalmente a alquiler.
- Permitir descarga del comprobante PDF con verificación de sesión y organización.
- Soportar anulación y marca de pago, con bloqueo posterior de edición.
- Reutilizar la infraestructura de documentos y la bitácora existente.

**Non-Goals:**

- Recibos con modelos comerciales personalizados (genérico/doble/mini): se genera un PDF técnico de recibo.
- Envío automático por email/WhatsApp del recibo.
- Números de recibo correlativos por organización (se puede agregar después sin cambiar la spec).
- Integración con facturación electrónica oficial (AFIP o similar).

## Decisions

- **Tabla `receipts` propia** en lugar de ampliar `documents`: el recibo tiene lógica de negocio propia (estado, período, cliente, alquiler, método, fecha de pago) que no encaja naturalmente en `documents`. El PDF se guarda en `documents` como tipo `archivo` y `receipts` guarda el vínculo `document_id`. _Alternativa:_ almacenar todo en `documents` con campos JSON — menos tipado y más difícil de consultar.
- **Cliente como destinatario principal** (inquilino o propietario), con alquiler opcional: un recibo puede emitirse sin alquiler vinculado (p. ej. recibo por depósito o reserva), por eso el FK a `rentals` es nullable con `set null`. _Alternativa:_ FK obligatoria a alquiler — excluiría recibos sueltos.
- **Estado `emitido | pagado | anulado`**: flujo simple y suficiente. Estados intermedios (borrador, enviado) quedan fuera de alcance.
- **PDF congelado al emitir**: los valores se graban en el PDF al momento de la emisión y no mutan si el alquiler o cliente cambian después. Conciliación futura por comparación, no recálculo.
- **Anulación solo para owner/admin** y marca de pago para owner/admin; emisión y descarga para cualquier miembro. Alineado con el módulo de liquidaciones.
- **Rutas en español** (`/recibos`, `/recibos/nuevo`, `/recibos/[id]`) siguiendo el naming del resto de la app.

## Risks / Trade-offs

- [Un recibo emitido podría duplicarse para el mismo cliente y período] → mitigado con validación de aplicación (no unicidad de DB, ya que un cliente puede legítimamente tener varios recibos en un período). Trackeo de duplicados exactos queda para el change de facturación.
- [Cliente vinculado eliminado o tipo cambiado] → FK con `set null` + validación de tipo al emitir; el recibo sobrevive como historial.
- [PDF `archivo` se confunde con otros archivos] → título normalizado `Recibo 2026-09 — <cliente>` con link directo desde la ficha.
- [Mutación de pagos posteriores no actualiza el recibo] → comportamiento aceptado: el monto es el declarado al emitir.

## Migration Plan

1. Migración Drizzle: tabla `receipts` con FKs por organización (`onDelete cascade` desde organizations; `set null` para cliente, alquiler y documento), e índice por organización + cliente + período para consultas rápidas.
2. Despliegue aditivo: no reescribe tablas existentes; rollback = revertir la migración.
3. Feature flag innecesario: la ruta `/recibos` se suma a la nav; un problema del módulo no afecta el resto.

## Open Questions

<!-- Ninguna que cambie specs, approach o tasks. -->
