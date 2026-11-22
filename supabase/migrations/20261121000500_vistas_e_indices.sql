-- =====================================================================
-- Observatorio de Precios PAC · Migración 5: vistas del comparador e índices de rendimiento
-- =====================================================================

-- Precio vigente = la observación más reciente de cada producto en cada sucursal.
-- security_invoker: la vista respeta las políticas RLS de quien consulta.
create view public.precios_vigentes
with (security_invoker = true)
as
select distinct on (p.producto_id, p.sucursal_id)
  p.id,
  p.producto_id,
  p.sucursal_id,
  p.precio,
  p.es_oferta,
  p.oferta_hasta,
  p.fuente,
  p.registrado_en
from public.precios p
order by p.producto_id, p.sucursal_id, p.registrado_en desc, p.id desc;

comment on view public.precios_vigentes is 'Comparador ciudadano: último precio de cada producto en cada sucursal.';

-- OPTIMIZACIÓN (ver docs/rendimiento.md):
-- 1) Comparador e historial filtran por producto (y sucursal) y ordenan por fecha descendente.
--    Este índice compuesto deja que Postgres lea solo las filas de ese producto, ya ordenadas,
--    en vez de recorrer y ordenar toda la tabla.
create index precios_producto_sucursal_fecha_idx
  on public.precios (producto_id, sucursal_id, registrado_en desc, id desc);

-- 2) Ficha del comercio: precios de una sucursal ordenados por fecha.
create index precios_sucursal_fecha_idx
  on public.precios (sucursal_id, registrado_en desc);

-- 3) Búsqueda de productos por nombre sin tildes y con errores de tipeo (pg_trgm).
create or replace function public.texto_busqueda(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(texto, '')));
$$;

create index productos_nombre_trgm_idx
  on public.productos using gin (public.texto_busqueda(nombre) extensions.gin_trgm_ops);

-- Búsqueda aproximada de productos para el buscador ciudadano.
create or replace function public.buscar_productos(p_texto text, p_limite int default 20)
returns setof public.productos
language sql
stable
security invoker
set search_path = ''
as $$
  select pr.*
    from public.productos pr
   where pr.activo
     and (
       public.texto_busqueda(pr.nombre) operator(extensions.%) public.texto_busqueda(p_texto)
       or public.texto_busqueda(pr.nombre) like '%' || public.texto_busqueda(p_texto) || '%'
       or public.texto_busqueda(p_texto) = any (pr.palabras_clave)
     )
   order by extensions.similarity(public.texto_busqueda(pr.nombre), public.texto_busqueda(p_texto)) desc
   limit least(greatest(p_limite, 1), 50);
$$;

grant execute on function public.buscar_productos(text, int) to anon, authenticated;
