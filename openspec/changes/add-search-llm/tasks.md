# Tasks: Add Search LLM

## 1. Base de datos

- [ ] 1.1 Agregar `llm_api_key` (nullable) a la tabla `integrations` y generar la migración con `npm run db:generate`
- [ ] 1.2 Verificar migración limpia sobre `.pgdata` y `.pgdata-e2e`

## 2. Cliente LLM

- [ ] 2.1 Crear `src/features/buscador/llm.ts`: `fetch` a la Responses API con prompt de extracción JSON, timeout de 3 segundos (AbortController) y validación por Zod contra el shape de intención
- [ ] 2.2 Resolución de la clave activa: clave de la organización si existe; si no, `process.env.OPENAI_API_KEY`; si no hay, sin consulta externa
- [ ] 2.3 Fallback determinista: ante cualquier falla (red, HTTP, JSON inválido), devolver la interpretación local con `interpretedBy: "local"`
- [ ] 2.4 Honrar `OPENAI_API_BASE` opcional para apuntar a endpoints compatibles (tests/staging)

## 3. Integración en el buscador

- [ ] 3.1 Modificar el pipeline del buscador: intentar el LLM si hay clave, usar vía de datos existente con el shape resultante y marcar `interpretedBy`
- [ ] 3.2 Ajustar los chips de intención para mostrar la marca "IA" o "local" según el origen

## 4. UI en /configuracion

- [ ] 4.1 Agregar el campo de clave de LLM con máscara y validación de formato `sk-...`, sin exponer el valor guardado

## 5. Tests

- [ ] 5.1 Test unitario del mapeo de respuesta LLM → shape de intención (JSON válido, JSON inválido, respuesta vacía)
- [ ] 5.2 E2E con doble server configurable: intención IA para una frase libre y fallback local con el servicio caído
- [ ] 5.3 E2E del buscador sin clave: el comportamiento queda idéntico al actual y no hay peticiones externas

## 6. Verificación

- [ ] 6.1 `npm run lint`, `npm run typecheck` y `npm run test:e2e` en verde
- [ ] 6.2 Revisión de logs: la clave nunca aparece en stdout, stderr ni en la base de query de diagnóstico
