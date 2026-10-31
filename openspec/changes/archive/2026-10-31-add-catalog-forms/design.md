# Add Catalog Forms — Design

## Context

`catalog_entries` ya guarda datos de referencia únicos por `(organizationId, kind, name)` con kinds tipo/amenities/servicios/etiquetas. `properties` no tiene campo de zona ni de amenities; sus formularios usan texto libre (dirección, ciudad, provincia). El buscador interpreta "en \<lugar\>" y lo aplica como término libre.

## Goals / Non-Goals

- **Goals**: selects desde el catálogo en alta/edición de propiedades; chips en la ficha; match de zonas en el buscador; aislamiento por tenant; degradación amable cuando el catálogo está vacío.
- **Non-Goals**: catálogos anidad-jerarquizados, plantillas por tipo de propiedad, widgets de "alta inline" desde el formulario (el alta de entradas sigue en `/catalogos`).

## Decisions

- **`properties.zone: text`** con el nombre de la entrada del catálogo (no FK): igual que hoy el resto de los formularios guarda texto; el match se hace por nombre y el borrado de entradas no rompe datos existentes (requerimiento: amenity eliminado con uso previo).
- **`properties.amenities: jsonb`** lista de strings. Normalización: se recorta espacio y se sortean antes de guardar; la UI compara con el catálogo por nombre exacto.
- **Migración Drizzle** con valores default (null/[]) hacia atrás; sin backfill (datos preexistentes no tienen zona ni amenities).
- **Selects server-rendered**: la consulta del catálogo por kind se reutiliza en `src/features/catalogos/data` exponiendo `listOptions(orgId, kinds)`, fuera del cliente, con carga por Server Component.
- **Fallback cuando el catálogo está vacío**: el campo de zona usa input de texto libre (comportamiento actual); el multiselección se oculta y se muestra un aviso con enlace a `/catalogos` y al botón de carga de ejemplos.
- **Buscador**: en `features/buscador/query.ts`, el intérprete obtiene (desde la capa de datos, acotada al tenant) la lista de nombres de zonas con match case-insensitive; si coincide, el filtro de propiedades aplica la zona exacta, si no queda término libre.

## Open Questions

- ¿Etiquetas por cliente? No en esta tanda: el alcance queda en propiedades; extenderlo al CRM sería un change posterior que reutilice el mismo patrón.
