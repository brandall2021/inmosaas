# Tasks: Add Catalog Forms

## 1. Base de datos

- [ ] 1.1 Agregar `zone` (text, nullable) y `amenities` (jsonb, default []) a `properties` en `src/db/schema.ts` y generar la migración con `npm run db:generate`
- [ ] 1.2 Verificar que `npm run db:migrate` aplica sobre `.pgdata` de desarrollo y que `.pgdata-e2e` migra limpia desde cero

## 2. Capa de datos y formularios

- [ ] 2.1 Agregar `listOptions(organizationId, kinds)` en `src/features/catalogos` (consulta server-side, orden por kind y nombre)
- [ ] 2.2 Extender los esquemas Zod y las actions de alta/edición de propiedades con `zone` y `amenities` (normalización con trim y orden)
- [ ] 2.3 Ajustar los formularios de alta/edición: select de zonas, multiselección de amenities/servicios y fallback a input libre cuando el catálogo de zonas está vacío
- [ ] 2.4 Mostrar zona y chips de amenities en la ficha y en el listado

## 3. Buscador

- [ ] 3.1 Ampliar el intérprete de `features/buscador` para matchear la parte "en \<lugar\>" contra los nombres de zona del catálogo activo (insensible a mayúsculas) y aplicarlo como filtro de zona en propiedades
- [ ] 3.2 Mostrar el chip de intención correspondiente cuando se reconoce una zona del catálogo

## 4. Tests E2E

- [ ] 4.1 Extender los tests de propiedades: alta con zona y amenities del catálogo, ficha que los muestra, y edición que conserva el dato después de borrar un amenity del catálogo
- [ ] 4.2 Extender los tests del buscador: consulta con zona del catálogo filtra propiedades y muestra el chip; consulta con zona desconocida sigue como término libre

## 5. Verificación

- [ ] 5.1 `npm run lint`, `npm run typecheck` y `npm run test:e2e` en verde
- [ ] 5.2 Prueba manual con dos organizaciones: los selects solo exponen el catálogo de cada tenant
