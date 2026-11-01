# Add Webhook Delivery — Design

## Context

`integrations` guarda por tenant `webhookUrl` + `webhookEnabled`, pero nadie lo llama. Las acciones de servicios ya registran en `activity_logs` qué operación existió (quién hizo qué y cuándo) — ese flujo es el punto de enganche natural para disparar la entrega. Conviene desacoplar: la entrega debe fallar sin afectar la operación del usuario.

## Goals / Non-Goals

- **Goals**: entrega real y firmable; observabilidad (log + ping de prueba); aislamiento por tenant; sin bloquear ni penalizar al usuario por la red externa.
- **Non-Goals**: colas persistentes con reintentos infinitos, UI para reenvío manual de entregas, contratos OpenAPI para los consumidores, webhooks entrantes.

## Decisions

- **Secreto opcional**: nueva columna `webhook_secret` (nullable) en `integrations`; el formulario ofrece un botón "generar" con una clave aleatoria, pero puede quedar vacía (sin firma). Nunca se devuelve completo al cliente: toggle de visibilidad y máscara.
- **Client en `src/lib/webhook.ts`**: entrega con `fetch` + `AbortController` (timeout 5 s) y como máximo un reintento ante fallos transitorios, tras una pausa fija (2 s); el disparo es fire-and-forget iniciado después del commit de la acción principal, sin que el usuario espere la respuesta.
- **Tabla `webhook_deliveries`**: `organizationId`, `event`, `payload` (jsonb), `attempt` (# reintentos), `httpStatus` (nullable), `error` (nullable, tipo resumido), `deliveredAt` (nullable), timestamps. Índice por `(organizationId, createdAt DESC)` para el log de la UI.
- **Disparo**: cada feature con mutación (properties, clients, tasaciones, alquileres, documentos) llama a `enqueueWebhook(orgId, event, entity)` al final de la acción, con el mismo helper; el evento usa como payload los datos ya persistidos.
- **Nombres de eventos**: `property.created|updated|deleted`, `client.*`, `valuation.*`, `rental.*`, `document.*` (con `ping` para el botón de prueba). Contrato estable para consumidores.
- **UI**: en `/configuracion`, sección "Entregas" con el último N entregas, colores por estado y botón "Probar conexión" (mismo helper de entrega; el registro queda en la tabla).
- **Sin job/workers externos**: el reintento único vive en el mismo proceso async de la entrega; si el server se corta a mitad, perdemos esa entrega (aceptable en best-effort).

## Open Questions

- ¿Frecuencia de limpieza de la tabla de entregas? Fuera de alcance: retención indefinida por ahora; la paginación del log le impuso el criterio.
