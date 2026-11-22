-- =====================================================================
-- Observatorio de Precios PAC · Migración 7: el trigger de precios no oculta los errores de clave foránea
-- =====================================================================
-- Incidencia detectada en las pruebas de integridad referencial (docs/incidencias.md):
-- antes_de_insertar_precio() respondía "El producto X no está activo" también cuando el producto NO EXISTÍA,
-- ocultando la violación de clave foránea (23503). Ahora solo rechaza productos/sucursales que existen pero
-- están inactivos; una referencia inexistente la rechaza la restricción FOREIGN KEY.

create or replace function privado.antes_de_insertar_precio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.registrado_por := auth.uid();
    new.registrado_en := now();
  end if;
  if exists (select 1 from public.productos where id = new.producto_id and not activo) then
    raise exception 'El producto % está desactivado en el catálogo municipal', new.producto_id using errcode = 'P0001';
  end if;
  if exists (select 1 from public.sucursales where id = new.sucursal_id and not activa) then
    raise exception 'La sucursal % está desactivada', new.sucursal_id using errcode = 'P0001';
  end if;
  if new.oferta_hasta is not null and new.oferta_hasta < current_date then
    raise exception 'La vigencia de la oferta no puede estar en el pasado' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function privado.antes_de_insertar_precio() from public, anon, authenticated;
