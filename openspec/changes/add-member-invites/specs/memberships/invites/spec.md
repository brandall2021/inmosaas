## Purpose

Ciclo completo de invitación de integrantes a la organización activa: un owner o admin invita por email con rol, se genera un enlace de un solo uso, y el invitado se une con su cuenta existente o creando una nueva, con protección del último owner.

## ADDED Requirements

### Requirement: Creación de invitación

Los roles owner y admin SHALL poder crear una invitación para la organización activa con email válido y rol objetivo (admin o member; ningún rol fuera de esos). La invitación SHALL registrar expiración a 7 días, quién invitó y estado pendiente, y SHALL rechazar emails duplicados con invitación pendiente vigente.

#### Scenario: Invitación creada

- **WHEN** un owner invita a un email nuevo con rol member
- **THEN** se crea la invitación pendiente y la pantalla de integrantes la lista con su expiración

#### Scenario: Email ya invitado

- **WHEN** se intenta invitar a un email que ya tiene una invitación pendiente vigente
- **THEN** se muestra un error de campo y no se crea una segunda invitación

#### Scenario: Member no puede invitar

- **WHEN** un miembro con rol member intenta crear una invitación
- **THEN** la acción se rechaza y la UI no presenta el formulario

### Requirement: Aceptación por enlace de un solo uso

El sistema SHALL entregar el enlace `/invitacion/<token>` (con botones de copia y mailto en la pantalla). Al abrir el enlace con sesión activa y email coincidente con la invitación, SHALL crearse el membership con el rol invitado, marcarse la invitación como aceptada y redirigir a la app con la organización activa del nuevo miembro. El token SHALL caducar a los 7 días y SHALL quedar inutilizable tras su primer uso.

#### Scenario: Invitado con cuenta existente acepta

- **WHEN** un usuario con sesión y con el email de la invitación abre el enlace
- **THEN** se crea su membership con el rol de la invitación y la invitación queda canjeada (ya no reutilizable)

#### Scenario: Invitado sin cuenta acepta al registrarse

- **WHEN** el invitado abre el enlace sin sesión y crea su cuenta con ese mismo email
- **THEN** después del signup la cuenta queda integrada a la organización invitante con el rol de la invitación

#### Scenario: Enlace caducado o ya usado

- **WHEN** se abre un enlace con token caducado o ya aceptado
- **THEN** se muestra un mensaje de invitación no válida sin filtrar detalles de la organización

#### Scenario: Email distinto al invitado

- **WHEN** un usuario con sesión de otro email abre el enlace
- **THEN** la aceptación se rechaza explicando que la invitación es para otro email

### Requirement: Revocación de invitaciones pendientes

Los roles owner y admin SHALL poder revocar cualquier invitación pendiente de la organización; la revocación SHALL invalidar el enlace de una vez y SHALL registrar la entrada en la bitácora.

#### Scenario: Revocación invalida el enlace

- **WHEN** el owner revoca una invitación pendiente
- **THEN** su enlace deja de funcionar y la invitación desaparece de la lista de pendientes

### Requirement: Gestión de roles y remoción de integrantes

La pantalla de integrantes SHALL permitir al owner/admin cambiar el rol de un miembro (a admin o a member) y remover miembros de la organización, con confirmación antes de remover. El último owner SHALL quedar protegido (no degradable ni removable). Al remover un miembro, su sesión SHALL quedar sin organización activa y la app SHALL redirigirlo a la selección de organización.

#### Scenario: Cambio de rol a admin

- **WHEN** el owner cambia el rol de un member a admin
- **THEN** el miembro pasa a tener los permisos de admin desde la próxima acción

#### Scenario: Protección del último owner

- **WHEN** se intenta degradar o remover al único owner de la organización
- **THEN** la acción se rechaza y se muestra un error que explicita la protección

#### Scenario: Remoción de un miembro

- **WHEN** el admin remueve a un member y confirma
- **THEN** el membership se elimina y la sesión de ese usuario queda sin organización activa

### Requirement: Alcance multi-tenant y auditoría

Cada operación SHALL operar únicamente sobre la organización activa del usuario autenticado y SHALL registrar en la bitácora las invitaciones creadas, revocadas y aceptadas, y los cambios de rol y remociones. El listado de miembros y pendientes SHALL ser visible para todos los miembros, con las acciones de escritura restringidas a owner/admin.

#### Scenario: Member ve la pantalla sin acciones

- **WHEN** un member visita integrantes de su organización
- **THEN** ve miembros y pendientes, sin los formularios de invitación, cambio de rol o remoción

#### Scenario: Invitación de otra organización

- **WHEN** la acción recibe una invitación perteneciente a otra organización
- **THEN** se rechaza sin exponer detalles de esa organización
