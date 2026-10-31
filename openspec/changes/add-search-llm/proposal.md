# Add Search LLM

## Why

El buscador funciona con un intérprete local determinista: entiende patrones fijos (operación, tipo, "en \<lugar\>", rangos de precio) pero falla con frases naturales libres (es "monoambiente luminoso cerca del centro con balcón", "nada en Rosario por encima de 100 mil"). Conectar un LLM hace entender esas consultas manteniendo el fallback local cuando no hay clave o el servicio falla.

## What Changes

- **Interpretación con LLM**: cuando la organización (o el server) tiene una clave configurada, el intérprete envía la consulta a OpenAI (modelos GPT) y recibe el mismo Shape de intención que hoy produce el intérprete local.
- **Configuración por organización** en `/configuracion`: campo de `llmApiKey` por tenant (opcional). El server también reconoce la variable de entorno `OPENAI_API_KEY` como fallback global.
- **Fallback determinista garantizado**: si no hay clave, el servicio falla o se agota el timeout, se usa el intérprete local actual en verde, y la UI muestra el chip "intención" marcada como IA o local según el origen.
- El LLM se limita a extraer la intención: nunca genera resultados, ni LLM inventa entidades; la captura de datos sigue la encima de la capa de datos existente.

## Capabilities

### New Capabilities

- `search/llm`: contrato de interpretación de consultas con LLM — activación por clave, Shape de intención igual al local, fallback local, marcado en la UI y seguridad (la clave nunca sale al cliente ni se loggea).

### Modified Capabilities

<!-- El comportamiento del intérprete local no cambia: sigue siendo el fallback y el contrato de intención es el mismo. -->

## Impact

- **Base de datos**: columna `llm_api_key` en `integrations` (nullable, la guarda junto al webhook en la misma fila por tenant).
- **Código nuevo**: `src/features/buscador/llm.ts` (cliente de interpretación con timeout y validación por Zod del Shape de intención).
- **Modificado**: `src/features/buscador` (origen de interpretación + login de fallback), `configuracion` (campo de clave opcional con máscara), UI del buscador (booleano "de origen" del chip).
- **Dependencia**: ninguna lib de SDK externa; se usa `fetch` directo con la Responses API.
- **Tests**: unit del mapeo de respuesta LLM → intención; E2E con un servidor doble (mock) para la API de OpenAI y escenario sin clave que garantiza el fallback del intérprete local.
