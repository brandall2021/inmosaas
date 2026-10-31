## Purpose

Interpretación de consultas del buscador con un LLM cuando hay clave configurada: la consulta en lenguaje natural se traduce al mismo shape de intención del intérprete local, con fallback garantizado a la interpretación local cuando no hay clave, falla el servicio o vence el timeout.

## ADDED Requirements

### Requirement: Activación por clave de organización o de server

La interpretación con LLM SHALL activarse si la organización configuró su clave en `/configuracion`, o si el server define la variable de entorno `OPENAI_API_KEY` como base global; la clave de la organización SHALL tener prioridad. Sin ninguna de las dos, el buscador SHALL comportarse exactamente como hoy (intérprete local).

#### Scenario: Buscador con clave de la organización

- **WHEN** la organización configuró su clave y el usuario busca una frase libre
- **THEN** la interpretación corre con el LLM y los resultados aplican el shape de intención correspondiente

#### Scenario: Sin clave configurada

- **WHEN** ni la organización ni el server tienen clave
- **THEN** la consulta se interpreta con el intérprete local y no se envía ninguna petición externa

#### Scenario: Clave del tenant con prioridad

- **WHEN** el server tiene `OPENAI_API_KEY` y la organización además configuró su propia clave
- **THEN** la interpretación usa la clave de la organización

### Requirement: Extracción de intención, no de resultados

El LLM SHALL utilizarse únicamente para convertir la consulta en un shape de intención con la misma estructura del intérprete local (operación, tipo de inmueble, zona, rango de precio, moneda, términos libres). Los resultados SHALL seguir obteniéndose con la capa de datos existente, aplicando los filtros de la misma manera que con el intérprete local.

#### Scenario: Frase libre con intención reconocida

- **WHEN** el usuario busca "monoambiente luminoso alquiler Rosario hasta 200 mil"
- **THEN** la intención reconoce la operación alquiler, el tipo monoambiente, la zona Rosario y el límite de precio, y los resultados provienen del módulo de datos existente

#### Scenario: Respuesta fuera del shape

- **WHEN** el LLM responde algo que no valida contra el shape de intención
- **THEN** la interpretación cae al intérprete local y se marca con origen local en la UI

### Requirement: Fallback ante error y timeout

Si la petición al LLM falla (red, código de error, clave inválida) o no responde dentro del timeout (3 segundos), la búsqueda SHALL resolver con el intérprete local sin repetir la consulta al LLM. El servicio SHALL intentar el LLM en cada nueva búsqueda sin quedar permanentemente deshabilitado.

#### Scenario: Servicio caído mantiene la búsqueda funcional

- **WHEN** el LLM no responde y vence el timeout
- **THEN** la búsqueda muestra los resultados de la interpretación local y el chip de intención indica el origen local

#### Scenario: Clave inválida cae al fallback

- **WHEN** la clave configurada devuelve un error de autenticación
- **THEN** la búsqueda resuelve con el intérprete local y no se reintenta con la misma clave dentro de la misma petición

### Requirement: Marcado del origen en la UI

La UI del buscador SHALL indicar en el bloque "cómo se interpretó tu búsqueda" si la intención provino del análisis IA (marca "IA") o del intérprete determinista local (marca "local").

#### Scenario: Chip visible del origen

- **WHEN** la intención proviene del LLM
- **THEN** el chip muestra la marca "IA"; si proviene del local, muestra "local"

### Requirement: Confidencialidad de la clave

La clave de LLM SHALL persistirse del lado server y nunca SHALL enviarse al navegador ni registrarse en los logs; la UI SHALL mostrar siempre una máscara sin opción de leer la clave guardada.

#### Scenario: La clave no sale del server

- **WHEN** cualquier llamada a la API del buscador se completa
- **THEN** la respuesta no incluye la clave en ningún campo y los logs del server no la registran
