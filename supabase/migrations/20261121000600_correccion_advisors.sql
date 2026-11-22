-- =====================================================================
-- Observatorio de Precios PAC · Migración 6: correcciones del Security/Performance Advisor de Supabase
-- =====================================================================
-- Incidencias detectadas al revisar el proyecto con el advisor (ver docs/incidencias.md):
--  1) [SEGURIDAD] Las funciones auxiliares de permisos (es_admin, rol_actual, ...) y las funciones de
--     trigger eran SECURITY DEFINER en el esquema "public", por lo que cualquiera podía invocarlas por
--     la API REST (/rest/v1/rpc/...). Se mueven a un esquema "privado" que la API no expone.
--  2) [RENDIMIENTO] Varias tablas tenían más de una política permisiva para el mismo rol y acción;
--     Postgres evalúa todas en cada consulta. Se consolidan en una política por acción.

create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to anon, authenticated, service_role;

-- ---------- Funciones auxiliares de permisos (en el esquema privado) ----------
create or replace function privado.rol_actual()
returns public.rol_usuario
language sql stable security definer set search_path = ''
as $$
  select p.rol from public.perfiles p where p.id = auth.uid() and p.activo;
$$;

create or replace function privado.es_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(privado.rol_actual() = 'admin', false);
$$;

create or replace function privado.es_personal_municipal()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(privado.rol_actual() in ('admin', 'fiscalizador'), false);
$$;

create or replace function privado.es_duenio_sucursal(p_sucursal_id bigint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
      from public.sucursales s
      join public.comercios c on c.id = s.comercio_id
      join public.perfiles p on p.id = c.propietario_id
     where s.id = p_sucursal_id and p.id = auth.uid() and p.activo and p.rol = 'comerciante'
  );
$$;

create or replace function privado.es_duenio_comercio(p_comercio_id bigint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
      from public.comercios c
      join public.perfiles p on p.id = c.propietario_id
     where c.id = p_comercio_id and p.id = auth.uid() and p.activo and p.rol = 'comerciante'
  );
$$;

-- Las políticas RLS se evalúan con el rol de quien consulta, por eso anon/authenticated necesitan EXECUTE.
-- Como el esquema "privado" no está expuesto en la API, no se pueden llamar por /rpc.
revoke execute on all functions in schema privado from public;
grant execute on function privado.rol_actual(), privado.es_admin(), privado.es_personal_municipal(),
  privado.es_duenio_sucursal(bigint), privado.es_duenio_comercio(bigint) to anon, authenticated, service_role;

-- ---------- Funciones de trigger ----------
alter function public.antes_de_insertar_precio() set schema privado;
alter function public.registrar_auditoria() set schema privado;

create or replace function public.proteger_sucursal()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.comercio_id <> old.comercio_id and not privado.es_admin() then
    raise exception 'No puedes mover una sucursal a otro comercio' using errcode = '42501';
  end if;
  return new;
end;
$$;
alter function public.proteger_sucursal() set schema privado;

create or replace function public.proteger_perfil()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not privado.es_admin() and (new.rol <> old.rol or new.activo <> old.activo or new.email <> old.email) then
    raise exception 'Solo un administrador puede cambiar el rol, el email o el estado de una cuenta'
      using errcode = '42501';
  end if;
  if old.id = auth.uid() and new.activo = false then
    raise exception 'No puedes desactivar tu propia cuenta' using errcode = '42501';
  end if;
  return new;
end;
$$;
alter function public.proteger_perfil() set schema privado;

revoke execute on function privado.antes_de_insertar_precio(), privado.registrar_auditoria(),
  privado.proteger_sucursal(), privado.proteger_perfil() from public, anon, authenticated;

-- ---------- RPC públicas: ahora usan las funciones del esquema privado ----------
create or replace function public.aprobar_solicitud(p_solicitud_id bigint)
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  s public.solicitudes_comerciante;
  nuevo_comercio bigint;
begin
  if not privado.es_admin() then
    raise exception 'Solo un administrador puede aprobar solicitudes' using errcode = '42501';
  end if;
  select * into s from public.solicitudes_comerciante where id = p_solicitud_id for update;
  if not found then
    raise exception 'La solicitud % no existe', p_solicitud_id using errcode = 'P0002';
  end if;
  if s.estado <> 'pendiente' then
    raise exception 'La solicitud ya fue revisada' using errcode = 'P0001';
  end if;
  update public.solicitudes_comerciante
     set estado = 'aprobada', revisado_por = auth.uid(), revisado_en = now()
   where id = s.id;
  if s.usuario_id is not null then
    update public.perfiles set activo = true where id = s.usuario_id;
  end if;
  insert into public.comercios (nombre, rut_empresa, tipo, propietario_id)
  values (s.comercio, s.rut_empresa, s.tipo, s.usuario_id)
  returning id into nuevo_comercio;
  return nuevo_comercio;
end;
$$;

create or replace function public.rechazar_solicitud(p_solicitud_id bigint)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not privado.es_admin() then
    raise exception 'Solo un administrador puede rechazar solicitudes' using errcode = '42501';
  end if;
  update public.solicitudes_comerciante
     set estado = 'rechazada', revisado_por = auth.uid(), revisado_en = now()
   where id = p_solicitud_id and estado = 'pendiente';
  if not found then
    raise exception 'La solicitud no existe o ya fue revisada' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------- Políticas consolidadas (una por rol y acción) ----------
do $$
declare
  pol record;
begin
  for pol in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end;
$$;

-- perfiles
create policy perfiles_select on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or (select privado.es_admin()));
create policy perfiles_update on public.perfiles for update to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));

-- categorias
create policy categorias_select on public.categorias for select to anon, authenticated using (true);
create policy categorias_insert on public.categorias for insert to authenticated with check ((select privado.es_admin()));
create policy categorias_update on public.categorias for update to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy categorias_delete on public.categorias for delete to authenticated using ((select privado.es_admin()));

-- productos
create policy productos_select on public.productos for select to anon, authenticated
  using (activo or (select privado.es_admin()));
create policy productos_insert on public.productos for insert to authenticated with check ((select privado.es_admin()));
create policy productos_update on public.productos for update to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));

-- comercios
create policy comercios_select on public.comercios for select to anon, authenticated using (true);
create policy comercios_insert on public.comercios for insert to authenticated with check ((select privado.es_admin()));
create policy comercios_update on public.comercios for update to authenticated
  using ((select privado.es_admin()) or (propietario_id = (select auth.uid()) and (select privado.rol_actual()) = 'comerciante'))
  with check ((select privado.es_admin()) or propietario_id = (select auth.uid()));
create policy comercios_delete on public.comercios for delete to authenticated using ((select privado.es_admin()));

-- sucursales
create policy sucursales_select on public.sucursales for select to anon, authenticated
  using (activa or (select privado.es_personal_municipal()) or privado.es_duenio_comercio(comercio_id));
create policy sucursales_insert on public.sucursales for insert to authenticated
  with check ((select privado.es_admin()) or privado.es_duenio_comercio(comercio_id));
create policy sucursales_update on public.sucursales for update to authenticated
  using ((select privado.es_admin()) or privado.es_duenio_comercio(comercio_id))
  with check ((select privado.es_admin()) or privado.es_duenio_comercio(comercio_id));
create policy sucursales_delete on public.sucursales for delete to authenticated using ((select privado.es_admin()));

-- precios: fiscalizador/admin en cualquier sucursal; comerciante solo en las suyas. Sin UPDATE (historial inmutable).
create policy precios_select on public.precios for select to anon, authenticated using (true);
create policy precios_insert on public.precios for insert to authenticated
  with check (
    ((select privado.es_personal_municipal()) and fuente in ('fiscalizador', 'ocr'))
    or (privado.es_duenio_sucursal(sucursal_id) and fuente in ('comerciante', 'carga'))
  );
create policy precios_delete on public.precios for delete to authenticated using ((select privado.es_admin()));

-- capturas
create policy capturas_select on public.capturas for select to authenticated
  using (fiscalizador_id = (select auth.uid()) or (select privado.es_admin()));
create policy capturas_insert on public.capturas for insert to authenticated
  with check ((select privado.es_personal_municipal()) and fiscalizador_id = (select auth.uid()));

-- reportes ciudadanos
create policy reportes_insert on public.reportes for insert to anon, authenticated with check (estado = 'pendiente');
create policy reportes_select on public.reportes for select to authenticated using ((select privado.es_personal_municipal()));
create policy reportes_update on public.reportes for update to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));

-- solicitudes de comerciantes
create policy solicitudes_select on public.solicitudes_comerciante for select to authenticated
  using (usuario_id = (select auth.uid()) or (select privado.es_admin()));

-- auditoría y eventos de monitoreo
create policy auditoria_select on public.auditoria for select to authenticated using ((select privado.es_admin()));
create policy eventos_insert on public.eventos_app for insert to anon, authenticated
  with check (usuario_id is null or usuario_id = (select auth.uid()));
create policy eventos_select on public.eventos_app for select to authenticated using ((select privado.es_admin()));

-- ---------- Elimina las versiones públicas de las funciones auxiliares ----------
drop function public.es_duenio_sucursal(bigint);
drop function public.es_duenio_comercio(bigint);
drop function public.es_personal_municipal();
drop function public.es_admin();
drop function public.rol_actual();
