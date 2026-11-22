# Plan de pruebas y protocolo

## 1. Casos de uso y escenarios críticos

Flujos de la EV2 que se pueden probar en la versión 1.3.0:

| # | Flujo | Caso normal (resultado esperado) | Entradas límite y errores a probar |
|---|---|---|---|
| F1 | **Comparador ciudadano** (buscar producto, ver precios por comercio) | Lista de comercios con su precio vigente, ordenada por precio; etiqueta «Más barato». | Producto sin precios; búsqueda con tildes o errores («azucar», «arros»); sucursal desactivada (no debe aparecer). |
| F2 | **Historial de precios** | Gráfico con las observaciones del producto en la sucursal, en orden cronológico. | Un solo precio registrado; muchas observaciones (500.000 filas en la prueba de rendimiento). |
| F3 | **Registrar precio (comerciante)** | El precio se guarda y aparece al instante en el comparador. | Precio 0, negativo o > $10.000.000; oferta mayor que el precio normal; vigencia con formato inválido o en el pasado; **sucursal ajena**; producto inexistente. |
| F4 | **Captura del fiscalizador** (OCR simulado / manual) | Captura y precios guardados juntos; aparecen en «Historial de capturas». | Fila sin producto o sin precio; producto inexistente en una de las filas (no debe guardar nada: transacción). |
| F5 | **Registro de comerciante** (2 pasos) | Solicitud «en revisión»; la cuenta no puede usarse hasta ser aprobada. | RUT con dígito verificador incorrecto; email inválido; contraseña < 8; teléfono inválido; email ya registrado. |
| F6 | **Aprobación de cuentas (administrador)** | La cuenta se activa, se crea el comercio con su dueño y queda en auditoría. | Aprobar dos veces; un no administrador intenta aprobar. |
| F7 | **Inicio de sesión por perfil** | Cada perfil entra a su panel. | Contraseña incorrecta; cuenta desactivada; cuenta pendiente. |
| F8 | **Reporte ciudadano** | Reporte guardado y visible para el personal municipal. | Sin motivo; comentario > 500 caracteres; sucursal inexistente. |
| F9 | **Gestión de sucursales (comerciante)** | Edita su sucursal (horario, ubicación). | Editar sucursal ajena; mover la sucursal a otro comercio. |

## 2. Alcance, tipos de prueba y responsables

| Tipo | Qué cubre | Herramienta | Entorno | Cómo ejecutar |
|---|---|---|---|---|
| **Unitarias** | Validación de RUT, formato de precios, conversión de datos, mensajes de error, ids de productos | Jest (`jest-expo`) | Local (Node) | `npm test` |
| **Integración** | Base de datos real: claves foráneas, CHECK, transacciones, RLS por rol, Edge Functions | `node:test` + `@supabase/supabase-js` | Supabase (proyecto en la nube) | `npm run test:integracion` |
| **Funcionales E2E** | Flujo completo en el navegador: registrar precio → comparador; login rechazado; RUT inválido | Playwright (equivalente a Selenium) | Build de producción web (`expo export` + `expo serve`) contra Supabase | `npm run test:e2e` |
| **Rendimiento** | Consultas del comparador y del historial con 500.000 precios, antes y después del índice | SQL (`EXPLAIN ANALYZE` + mediana de 15 ejecuciones) | Supabase (esquema `bench` temporal) | [`supabase/pruebas/rendimiento_comparador.sql`](../supabase/pruebas/rendimiento_comparador.sql) |
| **Carga / estrés** | 20 conexiones concurrentes durante 30 s por escenario contra la API REST | autocannon | Supabase (plan gratuito) | `npm run test:carga` |
| **Seguridad** | Accesos permitidos y denegados por rol, datos protegidos, validación en el servidor | Incluidas en las pruebas de integración + Security Advisor | Supabase | `npm run test:integracion` |
| **Estáticas** | Tipos y reglas de código | TypeScript (`strict`) + ESLint (`eslint-config-expo`) | Local | `npm run typecheck` · `npm run lint` |

**Responsables:** completar con los nombres del equipo. Ejemplo de reparto: *Integrante 1* · base de datos, pruebas de integración y de carga; *Integrante 2* · interfaz, pruebas E2E y revisión de los PR.

## 3. Scripts automatizados

| Archivo | Casos |
|---|---|
| [`src/lib/__tests__/rut.test.ts`](../src/lib/__tests__/rut.test.ts) | RUT válido/inválido, DV K y 0, formato. |
| [`src/lib/__tests__/format.test.ts`](../src/lib/__tests__/format.test.ts) | Precios en pesos, lectura de precios escritos, tildes. |
| [`src/services/__tests__/mappers.test.ts`](../src/services/__tests__/mappers.test.ts) | Conversión de filas, fechas de oferta, mensajes de error por código de Postgres. |
| [`src/services/__tests__/repository.test.ts`](../src/services/__tests__/repository.test.ts) | Id de productos nuevos compatible con la restricción CHECK. |
| [`tests/integracion/integridad.test.mjs`](../tests/integracion/integridad.test.mjs) | Precio con producto y sucursal válidos; FK inexistente (23503); CHECK (23514); transacción revertida. |
| [`tests/integracion/seguridad.test.mjs`](../tests/integracion/seguridad.test.mjs) | Login rechazado; cuenta desactivada; comerciante en sucursal propia (permitido) y ajena (denegado); escalada de rol; anónimo sin acceso a auditoría; Edge Functions 400/401/403. |
| [`tests/e2e/flujo-precio.spec.ts`](../tests/e2e/flujo-precio.spec.ts) | Flujo completo comerciante → ciudadano; entorno identificado y pantallas de monitoreo/auditoría; asistente con IA; login incorrecto; RUT inválido. Guarda capturas en `docs/evidencias/`. |
| [`tests/carga/carga.mjs`](../tests/carga/carga.mjs) | 3 escenarios de carga; guarda `docs/evidencias/reporte-carga.json`. |

Las pruebas de integración y de carga necesitan `.env.local` (ver `.env.example`). Las E2E necesitan la app corriendo: `npx expo export -p web && npx expo serve --port 8082` y luego `E2E_BASE_URL=http://localhost:8082 npm run test:e2e`.

## 4. Métricas y resultados

Ejecutadas el 21-11-2026 (Windows 11, Node 24, Supabase plan gratuito en `sa-east-1`).

| Prueba | Criterio de aceptación | Esperado | Obtenido | ¿Cumple? |
|---|---|---|---|---|
| Unitarias | 100 % de casos pasan | 20/20 | **20/20** | ✅ |
| Integración | 100 % de casos pasan | 26/26 | **26/26** (7,3 s) | ✅ |
| E2E | 100 % de casos pasan | 5/5 | **5/5** contra la URL publicada (39,7 s) | ✅ |
| Precio con referencia inexistente | La base lo rechaza con 23503 | 23503 | `23503 · violates foreign key constraint "precios_producto_id_fkey"` | ✅ |
| Precio negativo | La base lo rechaza con 23514 | 23514 | `23514 · precios_precio_check` | ✅ |
| Comerciante en sucursal ajena | Denegado (42501) | 42501 | `42501 · new row violates row-level security policy for table "precios"` | ✅ |
| Comerciante edita sucursal ajena | 0 filas afectadas | 0 | 0 filas, horario sin cambios | ✅ |
| Flujo registrar precio → comparador | El precio aparece como «Más barato» | $860 visible | $860 visible en otro navegador sin sesión | ✅ |
| Rendimiento comparador (500.000 filas) | Mejora ≥ 5× con el índice | ≥ 5× | **34,7 ms → 1,7 ms (20×)** | ✅ |
| Rendimiento historial (500.000 filas) | Mejora ≥ 5× con el índice | ≥ 5× | **35,0 ms → 0,09 ms (~400×)** | ✅ |
| Carga · comparador | p97,5 ≤ 500 ms y 0 errores | ≤ 500 ms | p97,5 **162 ms**, 5.271 solicitudes, 0 errores | ✅ |
| Carga · historial | p97,5 ≤ 500 ms y 0 errores | ≤ 500 ms | p97,5 **157 ms**, 5.363 solicitudes, 0 errores | ✅ |
| Carga · catálogo | p97,5 ≤ 500 ms y 0 errores | ≤ 500 ms | p97,5 **160 ms**, 5.214 solicitudes, 0 errores | ✅ |
| Calidad estática | 0 errores de TypeScript y ESLint | 0 | 0 | ✅ |

Detalle del rendimiento en [`rendimiento.md`](rendimiento.md). Salidas completas en [`evidencias/`](evidencias/).
