# Tasks: Add Catalog Forms

## 1. Base de datos

- [x] 1.1 Agregar `zone` (text, nullable) y `amenities` (jsonb, default []) a `properties` en `src/db/schema.ts` y generar la migración con `npm run db:generate`
- [x] 1.2 Verificar que `npm run db:migrate` aplica sobre `.pgdata` de desarrollo y que `.pgdata-e2e` migra limpia desde cero (verificado dev en `0009_huge_zodiak.sql`; el arranque desde cero de E2E se corrobora en la suite completa, task 5.1)

## 2. Capa de datos y formularios

- [x] 2.1 Agregar `listOptions(organizationId, kinds)` en `src/features/catalogos` (consulta server-side, orden por kind y nombre) — implementado como `listCatalogFormOptions(organizationId, kinds)` para seguir la convención `listX` del módulo
- [x] 2.2 Extender los esquemas Zod y las actions de alta/edición de propiedades con `zone` y `amenities` (normalización con trim y orden)
- [x] 2.3 Ajustar los formularios de alta/edición: select de zonas, multiselección de amenities/servicios y fallback a input libre cuando el catálogo de zonas está vacío
- [x] 2.4 Mostrar zona y chips de amenities en la ficha y en el listado

## 3. Buscador

- [x] 3.1 Ampliar el intérprete de `features/buscador` para matchear la parte "en \<lugar\>" contra los nombres de zona del catálogo activo (insensible a mayúsculas) y aplicarlo como filtro de zona en propiedades
- [x] 3.2 Mostrar el chip de intención correspondiente cuando se reconoce una zona del catálogo

## 4. Tests E2E

- [x] 4.1 Extender los tests de propiedades: alta con zona y amenities del catálogo, ficha que los muestra, y edición que conserva el dato después de borrar un amenity del catálogo
- [x] 4.2 Extender los tests del buscador: consulta con zona del catálogo filtra propiedades y muestra el chip; consulta con zona desconocida sigue como término libre

## 5. Verificación

- [x] 5.1 `npm run lint`, `npm run typecheck` y `npm run test:e2e` en verde (18/18 tests)
- [x] 5.2 Prueba manual con dos organizaciones: los selects solo exponen el catálogo de cada tenant (automatizada en el test E2E "el catálogo es por organización": la segunda organización ve el fallback de texto libre y no los amenities de la primera)
