# Tasks: Add Member Invites

## 1. Base de datos

- [ ] 1.1 Agregar la tabla `invites` a `src/db/schema.ts` (org, email, rol, tokenHash, status, invitedBy, expiresAt) con índice único parcial de pendientes y generar la migración
- [ ] 1.2 Verificar migración limpia sobre `.pgdata` y `.pgdata-e2e`

## 2. Feature integrantes

- [ ] 2.1 Crear `src/features/integrantes/`: acciones server de crear/revocar invitación, cambiar rol, remover miembro y aceptar invitación, con validación Zod y guards owner/admin
- [ ] 2.2 Generación y verificación del token de un solo uso (random + hash, expiración a 7 días), con el mismo patrón de hashing de sessions
- [ ] 2.3 Implementar la aceptación: con sesión y email matching → membership + estado aceptado + org activa del invitado; sin sesión → redirigir al signup con la invitación pendiente

## 3. Páginas y formularios

- [ ] 3.1 Crear la página `/configuracion/integrantes` con listado de miembros (rol), invitaciones pendientes (enlace, expiración, revocar), formulario de invitación con rol y botones de copia/mailto
- [ ] 3.2 Ajustar el signup para pre-cargar la invitación (creación de cuenta sin organización propia) y consumir la invitación al terminar el registro
- [ ] 3.3 Revisar el selector de organización para reflejar la/s organización/es sumadas por invitación

## 4. Auditoría

- [ ] 4.1 Registrar en la bitácora: invitación creada/revocada/aceptada, cambio de rol y remoción de miembro (best-effort)

## 5. Tests E2E

- [ ] 5.1 Crear `e2e/integrantes.spec.ts`: flujo completo owner → invitación → aceptación con cuenta nueva (signup) y con cuenta existente (login); pendiente duplicado y email distinto son rechazados
- [ ] 5.2 Probar protección del último owner (degradación y remoción rechazadas), revocación que invalida el enlace y remoción de un member (su sesión queda sin organización)
- [ ] 5.3 Verificar que un member ve la pantalla sin acciones de escritura
