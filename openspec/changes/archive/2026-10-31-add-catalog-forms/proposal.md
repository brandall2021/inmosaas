# Add Catalog Forms

## Why

Los catálogos por organización (zonas/barrios, amenities, servicios y etiquetas) ya existen con su CRUD y carga de ejemplos, pero no alimentan ninguna otra pantalla: el valor normalizado de los datos se pierde y los formularios usan texto libre, sin consistencia ni posibilidad de agrupar los datos cargados.

## What Changes

- Nueva columna `zone` en `properties` y nuevo campo de amenities/servicios por propiedad, poblados desde los catálogos de la organización.
- El formulario de alta/edición de **propiedades** muestra con el valor del catálogo un select de zonas y un multiselección de amenities/servicios, limitados por organización.
- El **buscador** interpreta el "en \<zona\>" de las consultas contra el catálogo de zonas activo (mejora del match).
- El Listado por ficha de propiedad muestra la zona/piso/sector y las features seleccionadas.
- Si el catálogo del tipo está vacío, los formularios ofrecen input libre (NORMALS fallback determinista, sin bloquear el alta).

## Capabilities

### New Capabilities

- `catalogs/forms`: comportamiento de selects y multiselección de catálogo en los formularios de la app (hoy: alta/edición de propiedades) más la interpretación de zonas en el buscador.

### Modified Capabilities

<!-- Ninguna tiene spec previa en openspec/specs; los módulos touched no tenían contrato y el módulo documents no cambia. -->

## Impact

- **Base de datos**: nuevas columnas en `properties` (`zone` text, `amenities` lista serializada) + migración Drizzle.
- **Código nuevo**: `src/features/catalogos` expone consultas por `catalogEntries` (select options por organización); formularios de propiedades adaptados.
- **Modificado**: `src/features/buscador` (match de zona contra catálogo de zonas), ficha de propiedad para mostrar los nuevos datos.
- **Tests**: extensiones E2E (alta con zona y amenities del catálogo, ficha, buscador).
