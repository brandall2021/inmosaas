# Add Webhook Delivery

## Why

`/configuracion` permite configurar la URL y activar un webhook saliente, y las acciones ya registran eventos en la bitácora, pero **el evento nunca sale** hacia la herramienta externa: no hay entrega HTTP. La integración con otros sistemas (CRM externo, n8n, Make) queda configurada pero muerta.

## What Changes

- Entrega real de eventos: al confirmar creación/edición/eliminación de propiedades, clientes, tasaciones, alquileres y documentos, el servidor POSTea un payload JSON al webhook configurado de la organización (si está activo).
- **Payload estable**: `{event, entity, entity_id, at, data}` con los datos de la entidad; destacando una firma HMAC-SHA256 del cuerpo en el header `X-InmoSaaS-Signature` cuando la organización definió un `webhookSecret`.
- **Nueva columna** `webhookSecret` en `integrations` y nueva tabla `webhook_deliveries` con el registro de intentos (evento, payload, status, código HTTP, error, reintentos).
- Entrega **best-effort, no bloqueante** para el usuario: la operación principal no espera el webhook (fire-and-forget con timeout y una reintent).
- Nueva sección **Entregas** en `/configuracion` con el log de entregas (últimos resultados, código de estado) y un botón "Probar conexión" que envía un evento `ping`.

## Capabilities

### New Capabilities

- `integrations/webhook`: contrato de entrega de eventos — disparadores, payload, firma HMAC, registro de entregas, reintentos y el evento de prueba ping.

### Modified Capabilities

<!-- Los requisitos de configuración en /configuracion ya descritos por la app no cambian: se agrega el campo de secreto OPCIONAL y el log de entregas a la misma pantalla. -->

## Impact

- **Base de datos**: columna `webhook_secret` en `integrations` y tabla `webhook_deliveries` + migración Drizzle.
- **Código nuevo**: `src/lib/webhook.ts` (delivery client con HMAC + timeout + retry), tabla de entregas en el modelo y sección "Entregas" en `/configuracion`.
- **Modificado**: `src/features/configuracion` (campo de secreto con toggle de visibilidad, sección de entregas y botón de prueba), features existentes incorporan el agregado de su evento de entrega después del commit principal.
- **Tests**: extensiones de E2E (entrega auditable desde la UI) y unit de HMAC; para la entrega HTTP, test contra un receptor local del propio Playwright.
