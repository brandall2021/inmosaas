## Purpose

Entrega real de eventos del sistema hacia el webhook saliente configurable por organización: el servidor POSTea un payload JSON firmado cuando se confirman operaciones relevantes, y cada intento queda registrado para observabilidad y reintentos.

## ADDED Requirements

### Requirement: Entrega de eventos al webhook activo

Al confirmarse una operación de creación, edición o eliminación sobre propiedades, clientes, tasaciones, alquileres o documentos, el servidor SHALL enviar una solicitud POST al webhook configurado de la organización si y solo si el webhook está activo con una URL válida. La operación principal SHALL completarse sin depender del resultado de la entrega (best-effort, no bloqueante).

#### Scenario: Propiedad creada dispara el webhook

- **WHEN** el webhook activo apunta a un receptor online y el usuario crea una propiedad
- **THEN** el receptor recibe el POST con el evento `property.created` y el detalle de la entidad

#### Scenario: Webhook inactivo no entrega

- **WHEN** la operación se confirma con el webhook desactivado
- **THEN** no se envía ningún POST y la operación se completa igual

#### Scenario: Fallo de conexión no rompe la operación

- **WHEN** el receptor está caído o no responde dentro del timeout
- **THEN** la operación principal se completa con éxito y el intento queda registrado como fallido

### Requirement: Payload y firma HMAC

El payload SHALL ser un objeto JSON con `event` (identificador del tipo), `entity_id`, `at` (timestamp ISO) y `data` con los valores relevantes de la entidad. Cuando la organización definió `webhookSecret`, el servidor SHALL acompañar el cuerpo con un header `X-InmoSaaS-Signature` calculado como HMAC-SHA256 del cuerpo con el secreto; sin secreto, el header no se envía.

#### Scenario: Receptor con secreto válido

- **WHEN** el receptor calcula el HMAC-SHA256 del cuerpo con el mismo secreto configurado
- **THEN** la firma del header coincide con la del cálculo del receptor

#### Scenario: Cuerpo modificado en tránsito

- **WHEN** algo modifica el cuerpo del mensaje antes de llegar al receptor con secreto
- **THEN** la firma del header no coincide con el cálculo original del receptor y este puede rechazar el evento

### Requirement: Registro de entregas y respuesta de pantalla

El sistema SHALL persistir cada intento de entrega (`webhook_deliveries`) con el evento, el payload, el código HTTP de respuesta o el tipo de error, y la cantidad de reintentos realizados. La página `/configuracion` SHALL mostrar el log conciso con estado de cada entrega y SHALL ofrecer el botón "Probar conexión" que dispara un evento `ping` de prueba.

#### Scenario: Entrega exitosa queda registrada

- **WHEN** el receptor responde 200 a un evento
- **THEN** la tabla de entregas documenta el intento con código 200

#### Scenario: Evento de prueba

- **WHEN** en /configuracion el usuario presiona "Probar conexión" con webhook activo
- **THEN** se envía un `ping` con la misma firma que el resto de los eventos y se registra en la tabla de entregas

### Requirement: Reintento con límite

Frente a una caída transitoria (timeout, respuesta 5xx, código 429), el sistema SHALL realizar un único reintento tras un intervalo corto; si el segundo intento también falla, la entrega se registra como fallida sin más intentos. Códigos de respuesta 4xx (excepto 429) SHALL considerarse error permanente sin reintento.

#### Scenario: Caída transitoria

- **WHEN** el receptor responde 503 al primer intento
- **THEN** el sistema reintenta una vez y registra el resultado final (éxito o dos intentos)

#### Scenario: URL inválida no reintenta

- **WHEN** el receptor responde 404
- **THEN** la entrega se marca fallida con cero reintentos

### Requirement: Alcance multi-tenant y auditoría

Cada organización SHALL entregar eventos solo de sus propias entidades y únicamente a la URL que ella configuró. La configuración del secreto y el acceso al log de entregas SHALL estar disponibles para los miembros de la organización activa, y ninguna organización SHALL leer entregas de webhooks ajenos.

#### Scenario: Entrega acotada por tenant

- **WHEN** dos organizaciones tienen webhooks distintos y ambas crean propiedades al mismo tiempo
- **THEN** cada receptor solo recibe los eventos de su propia organización
