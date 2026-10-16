# InmoSaaS

Plataforma SaaS inmobiliaria multi-tenant. Gestión de propiedades, clientes y
operaciones por organización, con autenticación por sesión y espacio de trabajo
por inquilino.

Implementación original construida sobre Next.js (App Router) + TypeScript.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack)
- **TypeScript** en modo estricto
- **Tailwind CSS v4** + **shadcn/ui** (Base UI)
- **Drizzle ORM** + **Postgres**
  - Desarrollo: **PGlite** embebido (sin servidor de base de datos)
  - Staging/Producción: Postgres real vía `DATABASE_URL`
- Sesiones respaldadas por base de datos (cookie `httpOnly`), contraseñas con
  `scrypt`

## Requisitos

- Node.js 20.9+ (probado con 24.x)
- No hace falta instalar Postgres ni Docker para desarrollar

## Puesta en marcha

```bash
npm install
npm run db:migrate   # crea el esquema en ./.pgdata (PGlite embebido)
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) y creá una cuenta en
`/signup` (se genera automáticamente una organización para el usuario).

## Variables de entorno

No son obligatorias en desarrollo. La app arranca con valores por defecto.

| Variable       | Requerida           | Descripción                                                                 |
| -------------- | ------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL` | Producción / staging | Cadena de conexión a Postgres. Si está presente, se usa `postgres-js`; si no, se usa PGlite en `./.pgdata`. |
| `UPLOAD_DIR`   | —                   | Carpeta donde se guardan las imágenes subidas. Por defecto `./.uploads`.     |
| `NODE_ENV`     | —                   | `production` marca la cookie de sesión como `secure`.                        |

> Creá tu propio archivo `.env` (local, no versionado) con `DATABASE_URL` para
> apuntar a un Postgres real. El repositorio no incluye archivos `.env`.

## Scripts

| Comando             | Descripción                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                              |
| `npm run build`     | Build de producción                                 |
| `npm run start`     | Sirve el build de producción                        |
| `npm run lint`      | ESLint                                              |
| `npm run typecheck` | Verificación de tipos (`tsc --noEmit`)              |
| `npm run test:e2e`   | Tests end-to-end con Playwright (build + server)   |
| `npm run test:e2e:ui` | Playwright en modo UI                             |
| `npm run db:generate` | Genera migraciones a partir de `src/db/schema.ts` |
| `npm run db:migrate`  | Aplica las migraciones pendientes                 |
| `npm run db:push`     | Sincroniza el esquema sin migraciones (dev)       |
| `npm run db:studio`   | Drizzle Studio                                    |

## Estructura

```
src/
  app/
    (auth)/            # Páginas públicas: login, signup
    (app)/             # Área autenticada: shell, dashboard, propiedades, CRM, tasaciones, alquileres, buscador, catálogos y configuración
    api/uploads/       # Sirve imágenes con verificación de sesión
    page.tsx           # Landing pública
  components/
    app-shell/         # Navegación (sidebar, mobile)
    ui/                # Componentes shadcn/ui
  db/
    schema.ts          # Tablas y relaciones (users, organizations, memberships, sessions, properties, property_images, clients, valuations, rentals, activity_logs, integrations)
    index.ts           # Conexión Drizzle (PGlite / Postgres), lazy
  features/
    auth/              # Acciones de sesión + formularios
    organizations/     # Selector de organización
    properties/        # Propiedades: acciones, consultas y componentes
    clients/           # CRM: acciones, consultas y componentes
    tasaciones/        # Tasaciones: acciones, consultas y componentes
    alquileres/        # Alquileres: acciones, consultas y componentes
    buscador/          # Buscador IA: intérprete de consultas + búsqueda cruzada
    catalogos/         # Catálogos: datos de referencia (zonas, amenities, servicios, etiquetas)
    configuracion/     # Integraciones, automatizaciones y bitácora de actividad
  lib/
    dal.ts             # Acceso a datos con guards de auth/autorización
    session.ts         # Sesiones respaldadas por base de datos
    password.ts        # Hash/verificación de contraseñas (scrypt)
    storage.ts         # Almacenamiento de imágenes en disco (filesystem local)
    validation.ts      # Esquemas Zod
    action-state.ts    # Contrato de resultados de Server Actions
  proxy.ts             # Redirect optimista por cookie (ex-middleware en Next 16)
e2e/                   # Tests end-to-end (Playwright)
playwright.config.ts   # Configuración de Playwright
```

## Tests

Los tests end-to-end usan Playwright. La primera vez hay que instalar el
navegador:

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright levanta la app con `next build && next start` en el puerto 3100 y
ejecuta los flujos de autenticación (registro, cierre de sesión, login,
credenciales inválidas), de propiedades (alta, edición, baja y subida/borrado de
imágenes), de CRM (alta, edición, búsqueda y baja de clientes), de tasaciones
(alta, edición y baja), de alquileres (alta con propiedad e inquilino, edición y
baja), de configuración (webhook, bitácora de actividad y validaciones), del
buscador (interpretación de consultas, búsqueda cruzada y estados vacíos) y de
catálogos (carga de ejemplos, alta, filtro por tipo, edición y baja).

## Modelo multi-tenant

- `users`: cuentas.
- `organizations`: inquilinos (workspaces).
- `memberships`: relación usuario ⇄ organización con `role` (`owner`/`admin`/`member`).
- `sessions`: sesiones activas (token hasheado, expiración).
- `properties`: propiedades de cada organización (`organizationId`).
- `property_images`: fotos de cada propiedad (clave de almacenamiento).
- `clients`: contactos del CRM de cada organización (`organizationId`).
- `valuations`: tasaciones de cada organización (`organizationId`), con referencia
  opcional a una propiedad.
- `rentals`: alquileres de cada organización (`organizationId`), con referencias
  opcionales a una propiedad y a un cliente (el inquilino).
- `activity_logs`: bitácora de cambios de cada organización (quién hizo qué y
  cuándo), de solo inserción.
- `integrations`: configuración de integraciones por organización (una fila por
  tenant, con webhook saliente).
- `catalog_entries`: datos de referencia por organización (zonas, amenities,
  servicios y etiquetas), únicos por `(organización, tipo, nombre)`.

La organización activa se guarda en la sesión. El acceso a datos se filtra
siempre por la organización activa del usuario autenticado.

## Propiedades

CRUD de propiedades por organización en `/propiedades`:

- **Listado** (`/propiedades`) con buscador por título/dirección/ciudad y filtro
  por estado.
- **Alta** (`/propiedades/nueva`) y **edición** (`/propiedades/[id]/editar`).
- **Ficha** (`/propiedades/[id]`) con características, datos de registro y
  **galería de imágenes**.

Cada consulta y mutación se limita a la organización activa; las acciones de
escritura exigen pertenencia al tenant y la baja está restringida a
`owner`/`admin`.

### Imágenes

- Se suben desde la ficha de la propiedad (PNG, JPG, WEBP o GIF, hasta 5 MB).
- Los archivos se guardan en `UPLOAD_DIR` (`./.uploads` por defecto) y **no** se
  sirven desde `public/`: se leen a través de `/api/uploads/[...key]`, que
  verifica la sesión y que la imagen pertenezca a la organización activa.
- El almacenamiento está aislado en `src/lib/storage.ts` para poder cambiarlo por
  object storage (S3, etc.) sin tocar el resto del código.

> `./.uploads/` está en `.gitignore` y no debe versionarse.

## Clientes / CRM

Gestión de la cartera de contactos por organización en `/crm`:

- **Listado** (`/crm`) con buscador por nombre/correo/teléfono y filtro por etapa
  del pipeline.
- **Alta** (`/crm/nuevo`) y **edición** (`/crm/[id]/editar`).
- **Ficha** (`/crm/[id]`) con datos de contacto, etapa y notas.
- Cada cliente tiene **tipo** (comprador, vendedor, inquilino, propietario) y
  **etapa** (nuevo, contactado, visitando, negociación, cerrado).

Igual que en Propiedades, las consultas se limitan a la organización activa y la
baja está restringida a `owner`/`admin`.

## Tasaciones

Registro de tasaciones y valor por m² por organización en `/tasaciones`:

- **Listado** (`/tasaciones`) con buscador por título/dirección y filtro por
  estado.
- **Alta** (`/tasaciones/nuevo`) y **edición** (`/tasaciones/[id]/editar`).
- **Ficha** (`/tasaciones/[id]`) con superficie, valor por m², valor total
  estimado y notas.
- Cada tasación tiene **estado** (pendiente, en revisión, completada) y puede
  referenciar opcionalmente una propiedad existente.

Mismo modelo de aislamiento multi-tenant que el resto de los módulos.

## Alquileres

Administración de contratos de alquiler por organización en `/alquileres`:

- **Listado** (`/alquileres`) con buscador por propiedad/inquilino y filtro por
  estado.
- **Alta** (`/alquileres/nuevo`) y **edición** (`/alquileres/[id]/editar`).
- **Ficha** (`/alquileres/[id]`) con canon mensual, período (inicio/fin),
  propiedad e inquilino.
- Cada alquiler tiene **estado** (vigente, finalizado, rescindido), **moneda** y
  **canon mensual**; la propiedad y el inquilino son opcionales (se eligen de los
  contactos y propiedades de la organización, o quedan sin asignar).

Las fechas se guardan como `YYYY-MM-DD` y se muestran sin corrimiento por zona
horaria.

## Buscador IA

Una búsqueda única (`/buscador`) que entiende consultas como *"casas en venta en
Rosario hasta usd 150000"* y devuelve coincidencias de propiedades, clientes,
tasaciones y alquileres a la vez.

- **Intérprete determinista** (`features/buscador/query.ts`, sin base ni red):
  extrae operación, tipo de propiedad, zona (tras "en"), rango de precio
  ("hasta"/"desde", con soporte `k`/`mil`, `$`, `usd`, `pesos`) y moneda, y deja
  el texto libre restante como términos de búsqueda.
- La UI muestra cómo se leyó la consulta (chips de "intención") y agrupa los
  resultados por módulo con enlaces directos a cada ficha.
- La capa de datos aplica las facetas a propiedades y los términos libres a
  todos los módulos, siempre acotado a la organización activa.

No usa un modelo externo: la interpretación es local y verificable. Conectar un
LLM real es la evolución natural de esta pantalla y encaja con la sección de
integraciones descrita más abajo.

## Integraciones y automatizaciones

En `/configuracion` conviven tres piezas, todas aisladas por organización:

- **Integraciones**: configuración de un webhook saliente (URL + activación).
  Al crear, editar o eliminar propiedades, clientes, tasaciones o alquileres se
  registra un evento en la bitácora; activar el webhook es lo que habilita su
  envío hacia herramientas externas. La fila `integrations` es única por tenant
  y la URL se valida como `http(s)://…` (activar sin URL devuelve un error de
  campo).
- **Automatizaciones**: señales calculadas al vuelo en cada visita, sin
  escribir nada en la base — alquileres vigentes que vencen dentro de los
  próximos 30 días y propiedades todavía sin fotos.
- **Actividad reciente**: bitácora de solo inserción (`activity_logs`) con quién
  hizo qué y cuándo. Se escribe desde las acciones de servidor de forma
  *best-effort*: si el registro falla, la operación principal no se rompe.

## Catálogos

Datos de referencia propios de cada organización en `/catalogos`, agrupados por
tipo: **zonas/barrios**, **amenities**, **servicios** y **etiquetas**.

- **Listado** (`/catalogos`) agrupado por tipo, con buscador y filtro por tipo; el
  conteo por tipo se muestra en cada pestaña.
- **Alta** (`/catalogos/nuevo`) y **edición** (`/catalogos/[id]/editar`) con
  validación y nombres únicos por `(tipo, nombre)` dentro de la organización.
- **Carga de ejemplos**: con el catálogo vacío, un botón siembra un set inicial
  de zonas, amenities, servicios y etiquetas (idempotente, no pisa lo existente).
- La baja de elementos requiere rol `owner`/`admin`, igual que el resto de los
  borrados.

Es la capa de datos de referencia de la app: hoy es explícita y editable, y está
lista para alimentar selects (por ejemplo, una zona en el alta de propiedades).

## Roadmap

- [x] Fundación: autenticación, sesiones, multi-tenant, layout y landing
- [x] Propiedades (listado, ficha, alta/edición/baja)
- [x] Propiedades: imágenes y galería
- [x] Clientes / CRM
- [x] Tasaciones y valor por m²
- [x] Administración de alquileres
- [x] Integraciones y automatizaciones
- [x] Buscador IA (búsqueda unificada con interpretación de consultas)
- [x] Catálogos (zonas, amenities, servicios y etiquetas)
