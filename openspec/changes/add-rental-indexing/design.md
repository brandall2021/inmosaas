# Design

## Context

El módulo de alquileres (`rentals`) ya tiene `rent_amount` (canon mensual), `currency`, `start_date`, `end_date` y `status`. Los cobros viven en `rental_payments` con monto y fecha congelados. No existe registro de ajustes de índice ni historial del canon vigente. La infraestructura de bitácora (`activityLogs`) y roles (`owner|admin|member`) ya está disponible. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Permitir configurar tipo de índice, día de ajuste y tasa de punitorio por alquiler.
- Conservar historial de canon vigente con fechas de inicio/fin.
- Sugerir el nuevo monto al aplicar un índice, editable antes de confirmar.
- Calcular y registrar punitorios por mora.
- Todo acotado a la organización activa.

**Non-Goals:**

- Ajuste automático programado (cron job): los ajustes se registran manualmente por el usuario.
- Aplicación retroactiva automática a pagos ya registrados: los pagos históricos no se tocan.
- Integración con servicios externos para obtener valores de índice: el usuario ingresa el valor del índice.
- Contratos comerciales con pagaré como tipo distinto: se maneja como nota o tipo de contrato futuro.

## Decisions

- **Tablas separadas para ajustes, historial y punitorios** en lugar de ampliar `rentals` con columnas JSON: cada entidad tiene ciclo de vida y consultas propias (historial por fecha, punitorios por estado). _Alternativa:_ una sola tabla `rental_events` con tipo —menos tipado y más difícil de consultar.
- **`index_type`, `adjustment_day`, `penalty_rate` como columnas en `rentals`**: son atributos de configuración del alquiler, simples y de lectura frecuente. _Alternativa:_ tabla de configuración por alquiler —más tablas para datos simples.
- **Cálculo sugerido `monto_anterior * (indice_nuevo / indice_base)`**: fórmula estándar de ajuste por índice, redondeada a 2 decimales, siempre editable por el usuario antes de confirmar.
- **Snapshot de historial al crear alquiler y al ajustar**: permite responder "cuánto se cobraba en mes X" sin recalcular. Los snapshots cierran vigencia al crear uno nuevo.
- **Punitorios como tabla propia** con estado `pendiente|pagado`: permiten seguimiento y cobro posterior. _Alternativa:_ campo en `rental_payments` —mezclaría conceptos diferentes.
- **Rutas bajo `/alquileres/[id]/ajustes`**: el ajuste pertenece a un alquiler, no es módulo de nivel superior.

## Risks / Trade-offs

- [Redondeo de 2 decimales puede generar centavos sueltos en ajustes sucesivos] → aceptado; el usuario edita el monto sugerido antes de confirmar.
- [Valor del índice ingresado manualmente puede tener errores de digitación] → mitigado con validación de que índice nuevo > 0 y sugerencia transparente; el usuario verifica antes de confirmar.
- [Punitorios calculados sobre montos ya pagados podrían duplicarse] → mitigado con validación de aplicación: el usuario indica el monto adeudado; no hay verificación automática contra `rental_payments`.
- [Índice `otro` sin valores predefinidos] → aceptado; el usuario ingresa los valores numéricos manualmente.

## Migration Plan

1. Migración Drizzle: agregar columnas `index_type`, `adjustment_day`, `penalty_rate` a `rentals`; crear tablas `rental_index_entries`, `rental_rent_history`, `rental_penalties` con FKs por organización.
2. Datos existentes: los alquileres existentes quedan con `index_type: NULL` y sin ajustes (compatibilidad total).
3. Despliegue aditivo: no reescribe datos; rollback = revertir la migración.

## Open Questions

<!-- Ninguna que cambie specs, approach o tasks. -->
