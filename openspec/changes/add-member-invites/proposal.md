# Add Member Invites

## Why

`memberships` soporta roles (`owner`/`admin`/`member`), pero no existe ningún flujo para sumar personas a una organización: cada usuario crea su propia cuenta con organización propia, por lo que el multi-tenant no puede incorporar integrantes de verdad (equipos de la inmobiliaria).

## What Changes

- Nueva tabla `invites` (organización, email, rol, token hasheado, estado, expiración, invitado por) con el flujo de invitación de integrantes.
- Nueva sección **Integrantes** en `/configuracion`: lista de miembros con rol, invitaciones pendientes, alta de invitación (email + rol) y gestión de roles/remoción.
- **Aceptación por enlace**: el owner/admin comparte el enlace generado (con copia al portapapeles y mailto); aceptar requiere sesión y registro del token → la cuenta existente se suma o el signup pre-carga la organización destino.
- Validaciones de seguridad: token de un solo uso, expiración a 7 días, email único pendiente por organización, y protección del último owner (no degradable ni removable).
- Bitácora de invitaciones (creación, revocación, aceptación) y cambios de rol en el registro de actividad.

## Capabilities

### New Capabilities

- `memberships/invites`: ciclo completo de invitación (creación, enlace de un solo uso, aceptación para cuentas nuevas o existentes, revocación, cambio de rol y remoción de integrantes) acotado por la organización activa.

### Modified Capabilities

<!-- No hay spec previa del módulo de organizaciones; el listado de miembros existente se consolida en esta pantalla. -->

## Impact

- **Base de datos**: tabla `invites` + migración Drizzle (ref: memberships para roles).
- **Código nuevo**: `src/features/integrantes/` (invitaciones, roles, aceptación), página `/configuracion/integrantes` y ruta `/invitacion/[token]` que resuelve la aceptación (con la sesión del usuario).
- **Modificado**: `src/app/(auth)/signup` (pre-carga de organización si llega al signup con invitación pendiente), actions de auth para aceptar después de crear la cuenta.
- **Tests**: E2E de invitación completa (invitar → aceptar con cuenta nueva y con existente, roles, remoción, último owner protegido, revocación).
