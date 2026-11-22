-- =====================================================================
-- Prueba de rendimiento: consultas del comparador y del historial de precios
-- Se ejecuta en un esquema aparte ("bench") para no tocar los datos reales.
-- Condiciones: misma tabla, mismos 500.000 registros, mismas consultas; solo cambia el índice.
-- Resultado documentado en docs/rendimiento.md
-- =====================================================================

-- 1) Datos de prueba: 200 productos × 100 sucursales × 25 observaciones = 500.000 precios
drop schema if exists bench cascade;
create schema bench;
create table bench.precios (
  id bigint generated always as identity primary key,
  producto_id text not null,
  sucursal_id bigint not null,
  precio integer not null check (precio > 0),
  es_oferta boolean not null default false,
  registrado_en timestamptz not null
);
insert into bench.precios (producto_id, sucursal_id, precio, es_oferta, registrado_en)
select 'p' || lpad(p::text, 3, '0'),
       s,
       500 + ((p * 37 + s * 11 + o * 7) % 4000),
       (p + s + o) % 9 = 0,
       now() - make_interval(days => o * 4, hours => (p + s) % 24)
  from generate_series(1, 200) p, generate_series(1, 100) s, generate_series(1, 25) o
 order by random(); -- orden aleatorio: así llegan los precios en la realidad (mezclados)
analyze bench.precios;

-- 2) Consultas medidas
-- A) Comparador: precio vigente de un producto en cada sucursal (como la vista precios_vigentes)
--    select distinct on (sucursal_id) sucursal_id, precio, registrado_en
--      from bench.precios where producto_id = 'p042'
--     order by sucursal_id, registrado_en desc, id desc;
-- B) Historial: evolución de un producto en una sucursal (gráfico de historial)
--    select registrado_en, precio from bench.precios
--     where producto_id = 'p042' and sucursal_id = 17 order by registrado_en;

-- Función auxiliar: ejecuta una consulta N veces y devuelve la mediana en milisegundos.
create or replace function bench.mediana_ms(consulta text, repeticiones int default 15)
returns numeric
language plpgsql
as $$
declare
  tiempos numeric[] := '{}';
  inicio timestamptz;
begin
  execute consulta; -- calentamiento (deja las páginas en caché, igual en ambos escenarios)
  for i in 1..repeticiones loop
    inicio := clock_timestamp();
    execute consulta;
    tiempos := tiempos || extract(epoch from clock_timestamp() - inicio) * 1000;
  end loop;
  return round((select percentile_cont(0.5) within group (order by t) from unnest(tiempos) t)::numeric, 3);
end;
$$;

-- 3) ANTES: sin índice
explain (analyze, buffers, costs off)
select distinct on (sucursal_id) sucursal_id, precio, registrado_en
  from bench.precios where producto_id = 'p042' order by sucursal_id, registrado_en desc, id desc;
select bench.mediana_ms($q$select distinct on (sucursal_id) sucursal_id, precio, registrado_en from bench.precios where producto_id = 'p042' order by sucursal_id, registrado_en desc, id desc$q$) as comparador_ms,
       bench.mediana_ms($q$select registrado_en, precio from bench.precios where producto_id = 'p042' and sucursal_id = 17 order by registrado_en$q$) as historial_ms;

-- 4) OPTIMIZACIÓN: el mismo índice compuesto de la migración 5 (precios_producto_sucursal_fecha_idx)
create index precios_producto_sucursal_fecha_idx on bench.precios (producto_id, sucursal_id, registrado_en desc, id desc);
analyze bench.precios;

-- 5) DESPUÉS: con índice (mismas consultas)
explain (analyze, buffers, costs off)
select distinct on (sucursal_id) sucursal_id, precio, registrado_en
  from bench.precios where producto_id = 'p042' order by sucursal_id, registrado_en desc, id desc;
select bench.mediana_ms($q$select distinct on (sucursal_id) sucursal_id, precio, registrado_en from bench.precios where producto_id = 'p042' order by sucursal_id, registrado_en desc, id desc$q$) as comparador_ms,
       bench.mediana_ms($q$select registrado_en, precio from bench.precios where producto_id = 'p042' and sucursal_id = 17 order by registrado_en$q$) as historial_ms;

-- 6) Limpieza
-- drop schema bench cascade;
