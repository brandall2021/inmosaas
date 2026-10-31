# Add Member Invites — Design

## Context

`memberships` ya modela usuario ⇄ organización con `role` (`owner`/`admin`/`member`), y el selector de organización existe (`features/organizations`). El signup crea la organización automáticamente para el nuevo usuario; falta el flujo de invitación para sumar cuentas existentes o nuevas.

## Goals / Non-Goals

- **Goals**: invitación por enlace de un solo uso expirable, soporte de cuentas existentes y nuevas, protección del último owner, revocación, auditoría.
- **Non-Goals**: envío real de email (no hay SMTP en el proyecto: la entrega se hace con copy + mailto), dominios corporativos con auto-join, orgs embebidas anidadas, SSO.

## Decisions

- **Tabla `invites`**: `organizationId`, `email` (lowercase), `role` (admin|member), `tokenHash` (hash del token tipo sesión, spc para no guardar el token raw), `status` (`pending`/`accepted`/`revoked`), `invitedBy` (userId), `expiresAt`, timestamps. Índice único parcial por `(organizationId, email)` con status pendiente para rechazar duplicados.
- **Token**: igual que las sessions — random de 32 bytes, mostrado sin hashear una única vez en el enlace y guardado con hash. La comparación se hace en memoria al resolver el enlace.
- **Aceptación**: `/invitacion/[token]` (página) + acción aceptar. Con sesión y email matching → crear membership y marcar aceptada. Sin sesión → redirigir a `/signup?[invite=<token>]`, donde el signup pre-carga el flujo y al crear la cuenta marca la aceptación (la organización propia automática solo se crea si NO viene invitación).
- **Organización activa**: al aceptar, la sesión del usuario se cambia a la organización invitante (coherente con el modelo de sesión que guarda la org activa).
- **Protección del último owner**: cheques en las actions de rol y remoción (count owners > 1 antes de degradar/remover). La remoción también invalida la sesión activa si la org removida era la org activa de ese usuario.
- **UI**: `/configuracion/integrantes` con dos bloques (miembros con roles y pendientes con expiración/enlace/revocación). Botones de acción visibles solo para owner/admin.
- **Emails**: minúsculas y trim al invitar, match case-insensitive al aceptar (para absorber errores de tipeo del invitado).

## Open Questions

- ¿Rol de invitación para la primera persona? No aplica: las organizaciones nacen con su owner (el que crea la cuenta).
