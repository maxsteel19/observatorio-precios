-- =====================================================================
-- Observatorio de Precios PAC · Migración 1: extensiones, tipos y validaciones
-- =====================================================================

-- pg_trgm: búsqueda aproximada de productos ("arros" encuentra "Arroz").
-- unaccent: búsqueda sin tildes ("azucar" encuentra "Azúcar").
-- pgcrypto: hash bcrypt para las contraseñas de las cuentas de prueba (seed).
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.rol_usuario as enum ('admin', 'fiscalizador', 'comerciante');

create type public.tipo_comercio as enum (
  'minimarket', 'almacen', 'feria', 'supermercado', 'panaderia', 'carniceria', 'otro'
);

-- Origen de un precio: fiscalizador (manual), ocr (captura de pizarra),
-- comerciante (ingreso manual) o carga (carga masiva CSV).
create type public.fuente_precio as enum ('fiscalizador', 'ocr', 'comerciante', 'carga');

create type public.modo_captura as enum ('ocr', 'manual');

create type public.estado_solicitud as enum ('pendiente', 'aprobada', 'rechazada');

create type public.estado_reporte as enum ('pendiente', 'revisado', 'descartado');

-- Valida un RUT chileno con su dígito verificador (módulo 11).
-- Es la misma regla que usa la app en src/lib/rut.ts, repetida en la base de datos
-- para que ningún cliente pueda guardar un RUT inválido.
create or replace function public.es_rut_valido(rut text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  limpio text := upper(regexp_replace(coalesce(rut, ''), '[^0-9kK]', '', 'g'));
  cuerpo text;
  dv text;
  suma int := 0;
  factor int := 2;
  resto int;
  esperado text;
begin
  if length(limpio) < 8 then
    return false;
  end if;
  cuerpo := left(limpio, length(limpio) - 1);
  dv := right(limpio, 1);
  if cuerpo !~ '^[0-9]+$' then
    return false;
  end if;
  for i in reverse length(cuerpo)..1 loop
    suma := suma + substr(cuerpo, i, 1)::int * factor;
    factor := case when factor = 7 then 2 else factor + 1 end;
  end loop;
  resto := 11 - (suma % 11);
  esperado := case resto when 11 then '0' when 10 then 'K' else resto::text end;
  return dv = esperado;
end;
$$;

comment on function public.es_rut_valido(text) is 'true si el RUT tiene un dígito verificador correcto (módulo 11).';
