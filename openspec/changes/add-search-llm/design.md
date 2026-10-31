# Add Search LLM — Design

## Context

`features/buscador/query.ts` interpreta localmente (sin red ni base) y devuelve un shape de intención con operación, tipo, zona, rango de precio, moneda y términos libres. La UI ya muestra chips de intención y filtra por módulo. En `/configuracion` existe la fila `integrations` por tenant (webhook); ahí vive naturalmente la clave de LLM.

## Goals / Non-Goals

- **Goals**: frases naturales entendidas por LLM; shape de intención idéntico al local; fallback determinista siempre; clave por tenant con fallback a env; clave nunca al cliente.
- **Non-Goals**: generación de resultados o respuestas en lenguaje natural del modelo, embeddings/búsqueda vectorial, límites de uso y métricas de consumo, clave por usuario.

## Decisions

- **Columna `llm_api_key`** (nullable) en `integrations`: se reutiliza la misma fila por tenant; máscara en la UI, sin lectura de la clave guardada y sin logging del valor.
- **Cliente minimalista en `src/features/buscador/llm.ts`**: `fetch` a `https://api.openai.com/v1/responses` con instrucción fija que pide JSON conforme al shape; validación estricta con el mismo Zod del intérprete local (reuso de `lib/validation`), parse fallido = fallback.
- **`OPENAI_API_BASE` opcional** en env para poder apuntar a un endpoint compatible en tests/staging (usado por el doble de pruebas).
- **Timeout de 3 s** con `AbortController`. Toda falla/caída en red/código HTTP = cae al local. Sin caché de intentos fallidos: cada consulta pide al LLM, así el servicio vuelve solo cuando se recupera.
- **Prompt determinista**: el prompt es una extracción de schema JSON (mapa de opciones: operación, tipos de inmueble, monedas) — sin historial ni memoria; cada consulta es independiente (stateless).
- **Solo IA marca el origen**: `interpretedBy: "ia" | "local"` viaja al resultado del intérprete y el chip lo pinta. La vista no cambia su lógica de filtro (ya transparente al shape).
- **Modelo**: `gpt-4o-mini` (clase económica, suficiente para extracción estructurada), configurable después si hace falta.

## Open Questions

- ¿Consumo y límites por tenant? Fuera de alcance: cada tenant usa su clave y paga directo a OpenAI; cuando el fallback es la env del server, el consumo corre por cuenta de la plataforma — vigilar en operación.
