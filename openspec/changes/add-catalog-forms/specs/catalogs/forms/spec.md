## Purpose

Los datos de referencia del catálogo (zonas/barrios, amenities, servicios y etiquetas) alimentan los campos de los formularios operativos: el alta de una propiedad elige del catálogo en vez de escribir texto libre, con consistencia y alcance por organización.

## ADDED Requirements

### Requirement: Select de zonas en alta y edición de propiedades

El formulario de alta y edición de una propiedad SHALL mostrar el campo de zona como un select poblado con las entradas del catálogo de tipo zonas de la organización activa. La zona elegida SHALL registrarse en la propiedad; al editar, el select SHALL partir con la zona guardada y SHALL aceptar vacío (opcional).

#### Scenario: Alta con zona del catálogo

- **WHEN** el usuario crea una propiedad eligiendo en el select una zona cargada en el catálogo
- **THEN** la propiedad se guarda con esa zona y la ficha la muestra

#### Scenario: Catálogo de zonas vacío

- **WHEN** la organización no tiene entradas de zonas
- **THEN** el formulario ofrece el input libre de siempre y la zona queda opcional

#### Scenario: Catálogo actualizado

- **WHEN** la organización agrega o quita entradas de zonas
- **THEN** los selects de todos los formularios reflejan el catálogo vigente

### Requirement: Multiselección de amenities/servicios en propiedades

El formulario de propiedad SHALL ofrecer un campo de características multiselección combinando las entradas de los tipos amenities y servicios del catálogo de la organización, como lista opcional. La propiedad SHALL guardar esas características y su ficha SHALL mostrarlas como etiquetas.

#### Scenario: Alta con amenities

- **WHEN** el usuario crea una propiedad marcando "parrilla" y "piscina" en el multiselección
- **THEN** la propiedad se guarda con esas características y la ficha las muestra

#### Scenario: Amenity eliminado del catálogo con uso previo

- **WHEN** un amenity se elimina del catálogo después de usarse en propiedades
- **THEN** las propiedades que ya lo tienen conservan el valor al editar y al mostrar; solo las selecciones nuevas se limitan al catálogo restante

### Requirement: Zonas del catálogo en el buscador

El intérprete del buscador SHALL considerar las entradas del catálogo de zonas vigentes al tratar la parte "en \<lugar\>" de una consulta; los términos que correspondan a una zona conocida SHALL filtrar las propiedades por la zona del catálogo.

#### Scenario: Consulta con zona del catálogo

- **WHEN** el usuario busca "casas en Palermo" y "Palermo" existe como zona de la organización
- **THEN** los resultados de propiedades se filtran por esa zona y el chip de intención muestra la zona reconocida

#### Scenario: Zona fuera del catálogo

- **WHEN** la consulta incluye un lugar que no matchea ninguna zona del catálogo
- **THEN** se conserva el comportamiento actual (término libre sobre título/dirección/ciudad)

### Requirement: Aislamiento multi-tenant

Los selects y multiselecciones SHALL poblarse únicamente con entradas de la organización activa del usuario autenticado, y no SHALL existir forma de persistir mediante el formulario referencias a catálogos de otra organización.

#### Scenario: Aislamiento por tenant

- **WHEN** un usuario abre un formulario con su organización activa
- **THEN** no ve entradas de zonas/amenities/servicios de otras organizaciones
