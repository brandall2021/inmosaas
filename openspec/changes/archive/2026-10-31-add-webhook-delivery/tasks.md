# Tasks: Add Webhook Delivery

## 1. Base de datos

- [x] 1.1 Agregar `webhook_secret` (nullable) a `integrations` y la tabla `webhook_deliveries` en `src/db/schema.ts`; generar la migración con `npm run db:generate`
- [x] 1.2 Verificar migración limpia sobre `.pgdata` y `.pgdata-e2e` (migración `0011_conscious_changeling.sql`; la suite E2E migra desde cero en cada corrida)

## 2. Delivery client

- [x] 2.1 Crear `src/lib/webhook.ts`: entrega POST con timeout (AbortController 5s), reintento único ante timeout/5xx/429 con pausa de 2s y registro en `webhook_deliveries`
- [x] 2.2 Implementar cálculo HMAC-SHA256 del cuerpo y header `X-InmoSaaS-Signature` cuando la organización define `webhookSecret` (helpers puros en `src/lib/webhook-signature.ts`)
- [x] 2.3 Definir los nombres de eventos (`property.*`, `client.*`, `valuation.*`, `rental.*`, `document.*`, `ping`) y el payload estable `{event, entity_id, at, data}`
- [x] 2.4 Exponer `enqueueWebhook(organizationId, event, entityId, data)` best-effort que consulta la integración activa del tenant y hace fire-and-forget

## 3. Puntos de disparo

- [x] 3.1 Agregar el disparo a las acciones de propiedades, clientes, tasaciones, alquileres y documentos, después del commit principal (con datos persistidos)

## 4. UI en /configuracion

- [x] 4.1 Agregar el campo "secreto de firma" con botón de generación aleatoria y máscara (sin mostrar el secreto guardado)
- [x] 4.2 Agregar la sección "Entregas" con las últimas entregas (fecha, evento, estado, HTTP) y el botón "Probar conexión" que envía un `ping` firmado

## 5. Tests

- [x] 5.1 Agregar test unitario del HMAC (firma de receptor coincide) y del comportamiento del header con y sin secreto
- [x] 5.2 Extender E2E: entrega registrada tras una creación de propiedad con receptor local, y clic en "Probar conexión" que muestra la entrega `ping` en el log
- [x] 5.3 Extender E2E: entrega perdida limpa cuando el webhook está desactivado

## 6. Verificación

- [x] 6.1 `npm run lint`, `npm run typecheck` y `npm run test:e2e` en verde (23/23 tests)
