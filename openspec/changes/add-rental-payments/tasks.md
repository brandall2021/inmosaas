# Tasks: Add Rental Payments

## 1. Base de datos

- [ ] 1.1 Agregar tabla `rental_payments` a `src/db/schema.ts` (org, alquiler, monto, moneda snapshot, fecha, método, notas, timestamps) y generar la migración con `npm run db:generate`
- [ ] 1.2 Verificar migración limpia sobre `.pgdata` de desarrollo y sobre `.pgdata-e2e` desde cero

## 2. Feature cobranzas

- [ ] 2.1 Crear `src/features/cobranzas/`: acciones server (registrar, editar, eliminar con confirmación), capa de datos (listado cronológico + agregaciones de resumen) y validación Zod
- [ ] 2.2 Agregar el bloque de resumen (total cobrado, último pago, meses cubiertos) y la tabla de pagos a la ficha de `alquileres/[id]`
- [ ] 2.3 Implementar el registro de pago en un formulario en la misma ficha, con redirect al completar y errores por campo
- [ ] 2.4 Restringir edición/eliminación a `owner`/`admin` y ocultar las acciones de administración para el resto de los miembros

## 3. Auditoría

- [ ] 3.1 Registrar en la bitácora cada alta, edición y baja de pago (best-effort, desacoplado del resto de las actions)

## 4. Tests E2E

- [ ] 4.1 Crear `e2e/pagos.spec.ts`: registro de pago válido, monto inválido muestra error, listado en orden cronológico, resumen actualizado, alquiler sin pagos y edición por owner/admin
- [ ] 4.2 Extender test de permisos: un member no puede eliminar pagos y el alquiler finalizado sigue mostrando el historial

## 5. Verificación

- [ ] 5.1 `npm run lint`, `npm run typecheck` y `npm run test:e2e` en verde
