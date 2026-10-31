# Tasks: Add Webhook Delivery

## 1. Base de datos

- [ ] 1.1 Agregar `webhook_secret` (nullable) a `integrations` y la tabla `webhook_deliveries` en `src/db/schema.ts`; generar la migración con `npm run db:generate`
- [ ] 1.2 Verificar migración limpia sobre `.pgdata` y `.pgdata-e2e`

## 2. Delivery client

- [ ] 2.1 Crear `src/lib/webhook.ts`: entrega POST con timeout (AbortController 5s), reintento único ante timeout/5xx/429 con pausa de 2s y registro en `webhook_deliveries`
- [ ] 2.2 Implementar cálculo HMAC-SHA256 del cuerpo y header `X-InmoSaaS-Signature` cuando la organización define `webhookSecret`
- [ ] 2.3 Definir los nombres de eventos (`property.*`, `client.*`, `valuation.*`, `rental.*`, `document.*`, `ping`) y el payload estable `{event, entity_id, at, data}`
- [ ] 2.4 Exponer `enqueueWebhook(organizationId, event, entityId, data)` best-effort que consulta la integración activa del tenant y hace fire-and-forget

## 3. Puntos de disparo

- [ ] 3.1 Agregar el disparo a las acciones de propiedades, clientes, tasaciones, alquileres y documentos, después del commit principal (con datos persistidos)

## 4. UI en /configuracion

- [ ] 4.1 Agregar el campo "secreto de firma" con botón de generación aleatoria y máscara (sin mostrar el secreto guardado)
- [ ] 4.2 Agregar la sección "Entregas" con las últimas entregas (fecha, evento, estado, HTTP) y el botón "Probar conexión" que envía un `ping` firmado

## 5. Tests

- [ ] 5.1 Agregar test unitario del HMAC (firma de receptor coincide) y del comportamiento del header con y sin secreto
- [ ] 5.2 Extender E2E: entrega registrada tras una creación de propiedad con receptor local, y clic en "Probar conexión" que muestra la entrega `ping` en el log
- [ ] 5.3 Extender E2E: entrega perdida limpa cuando el webhook está desactivado

## 6. Verificación

- [ ] 6.1 `npm run lint`, `npm run typecheck` y `npm run test:e2e` en verde
