# Optimización de consultas y pruebas de carga

## 1. Consulta optimizada: comparador e historial de precios

**Consultas** (las que usa la app):

```sql
-- A) Comparador: precio vigente de un producto en cada sucursal (vista precios_vigentes)
select distinct on (sucursal_id) sucursal_id, precio, registrado_en
  from precios where producto_id = 'p042'
 order by sucursal_id, registrado_en desc, id desc;

-- B) Historial: evolución de un producto en una sucursal (gráfico)
select registrado_en, precio from precios
 where producto_id = 'p042' and sucursal_id = 17 order by registrado_en;
```

**Problema:** `precios` es un historial que solo crece (cada observación es una fila nueva). Sin índice, Postgres recorre la tabla completa y ordena el resultado en cada consulta.

**Cambio:** índice compuesto en el mismo orden en que se filtra y ordena (migración [`20261121000500_vistas_e_indices.sql`](../supabase/migrations/20261121000500_vistas_e_indices.sql)):

```sql
create index precios_producto_sucursal_fecha_idx
  on public.precios (producto_id, sucursal_id, registrado_en desc, id desc);
```

**Por qué funciona:** con `producto_id` primero, Postgres salta directo a las filas del producto. Como el índice ya viene ordenado por sucursal y fecha descendente, `DISTINCT ON` toma la primera fila de cada sucursal sin ordenar nada. El historial (producto + sucursal) lee solo sus 25 filas recorriendo el índice hacia atrás.

### Condiciones de la medición

- Supabase plan gratuito, región `sa-east-1`, PostgreSQL 17, 21-11-2026.
- Tabla de prueba `bench.precios` (esquema aparte, para no tocar los datos reales) con **500.000 filas**: 200 productos × 100 sucursales × 25 observaciones, insertadas en orden aleatorio. 43 MB de tabla y 24 MB de índice.
- Mismas consultas y mismos datos antes y después; solo cambia la existencia del índice.
- Tiempo = **mediana de 15 ejecuciones** después de una ejecución de calentamiento (función `bench.mediana_ms`).
- Script reproducible: [`supabase/pruebas/rendimiento_comparador.sql`](../supabase/pruebas/rendimiento_comparador.sql).

### Resultados

| Consulta | Antes (sin índice) | Después (con índice) | Mejora |
|---|---|---|---|
| A) Comparador (100 sucursales) | **34,7 ms** · Parallel Seq Scan, 4.217 páginas, 497.500 filas descartadas, Sort | **1,7 ms** · Index Scan, sin Sort | **20×** |
| B) Historial (25 filas) | **35,0 ms** · Parallel Seq Scan, 4.205 páginas, 499.976 filas descartadas, Sort | **0,09 ms** · Index Scan Backward, 34 páginas | **~400×** |

Plan **antes** (comparador):

```
Unique (actual time=60.481..133.106 rows=100)
  ->  Gather Merge (rows=2500)
        ->  Sort  Sort Key: sucursal_id, registrado_en DESC, id DESC
              ->  Parallel Seq Scan on precios  Filter: (producto_id = 'p042')
                    Rows Removed by Filter: 248750 (por worker)  Buffers: shared hit=4167
Execution Time: 134.602 ms   (primera ejecución, sin caché)
```

Plan **después** (comparador):

```
Unique (actual time=2.495..8.997 rows=100)
  ->  Index Scan using precios_producto_sucursal_fecha_idx on precios
        Index Cond: (producto_id = 'p042')   Buffers: shared hit=2500 read=18
Execution Time: 10.780 ms   (primera ejecución, sin caché)
```

Plan **después** (historial):

```
Index Scan Backward using precios_producto_sucursal_fecha_idx on precios (rows=25)
  Index Cond: ((producto_id = 'p042') AND (sucursal_id = 17))   Buffers: shared hit=34
Execution Time: 0.273 ms
```

Otros índices: `precios_sucursal_fecha_idx` (ficha del comercio), índices de todas las claves foráneas y un índice GIN `pg_trgm` para buscar productos sin tildes y con errores de tipeo.

## 2. Prueba de carga

- **Escenario:** muchos vecinos consultando el comparador al mismo tiempo, directamente contra la API REST de Supabase (PostgREST), con la clave pública (rol `anon`, RLS activo).
- **Entorno:** cliente Node 24 + autocannon desde Santiago (Windows 11) → Supabase plan gratuito en São Paulo.
- **Volumen:** 20 conexiones concurrentes, 30 s por escenario, 3 escenarios → **15.848 solicitudes** en total.
- **Criterio:** p97,5 ≤ 500 ms y 0 errores (autocannon no informa p95; p97,5 es más exigente).
- **Script:** [`tests/carga/carga.mjs`](../tests/carga/carga.mjs) · reporte: [`evidencias/reporte-carga.json`](evidencias/reporte-carga.json).

| Escenario | Solicitudes | req/s | Promedio | p50 | p90 | p97,5 | p99 | Máx | Errores | Cumple |
|---|---|---|---|---|---|---|---|---|---|---|
| Comparador (precios vigentes del arroz) | 5.271 | 176 | 113 ms | 106 ms | 137 ms | 162 ms | 236 ms | 431 ms | 0 | ✅ |
| Historial (arroz en sucursal 7) | 5.363 | 179 | 111 ms | 106 ms | 135 ms | 157 ms | 172 ms | 418 ms | 0 | ✅ |
| Catálogo de productos | 5.214 | 174 | 115 ms | 108 ms | 138 ms | 160 ms | 216 ms | 446 ms | 0 | ✅ |

**Lectura:** la mayor parte de los ~106 ms es la latencia de red Santiago–São Paulo; la consulta en la base de datos tarda pocos milisegundos (ver punto 1). Con 20 usuarios simultáneos no hubo errores ni degradación.

## 3. Monitoreo durante las pruebas

- **App:** cada operación con el backend se mide (`src/services/logger.ts`) y se guarda en `eventos_app`. El administrador la ve en **Panel → Monitoreo** (promedio, p95, errores). Ejemplos registrados: `registrar_precios_comerciante` ~181 ms; `iniciar_sesion` ~616 ms; 5 errores `iniciar_sesion` (contraseña incorrecta, de las pruebas).
- **Servidor:** Supabase → *Logs* (o la herramienta `query_logs`). Ejemplos del 22-11-2026 01:09 UTC, generados por las pruebas de seguridad:
  - `postgres_logs`: `new row violates row-level security policy for table "precios"` · `insert or update on table "precios" violates foreign key constraint "precios_producto_id_fkey"` · `permission denied for table auditoria`
  - `function_logs` (Edge Functions): `{"evento":"registro_rechazado","campos":["rut","rutEmpresa"]}` · `{"evento":"alta_usuario_denegada","usuario":"…0003"}`
