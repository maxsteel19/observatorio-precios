-- =====================================================================
-- Observatorio de Precios PAC · Migración 3: funciones de permisos, triggers y RPC
-- =====================================================================

-- ---------- Funciones auxiliares para las políticas RLS ----------
-- Son SECURITY DEFINER para poder leer perfiles/comercios sin recursión de RLS.
-- Solo cuentan los perfiles activos: una cuenta desactivada o pendiente no tiene permisos.

create or replace function public.rol_actual()
returns public.rol_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select p.rol from public.perfiles p where p.id = auth.uid() and p.activo;
$$;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.rol_actual() = 'admin', false);
$$;

create or replace function public.es_personal_municipal()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.rol_actual() in ('admin', 'fiscalizador'), false);
$$;

-- true si la sucursal pertenece a un comercio cuyo propietario es el comerciante con sesión iniciada.
create or replace function public.es_duenio_sucursal(p_sucursal_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.sucursales s
    join public.comercios c on c.id = s.comercio_id
    join public.perfiles p on p.id = c.propietario_id
    where s.id = p_sucursal_id
      and p.id = auth.uid()
      and p.activo
      and p.rol = 'comerciante'
  );
$$;

create or replace function public.es_duenio_comercio(p_comercio_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.comercios c
    join public.perfiles p on p.id = c.propietario_id
    where c.id = p_comercio_id
      and p.id = auth.uid()
      and p.activo
      and p.rol = 'comerciante'
  );
$$;

-- ---------- Integridad de los precios ----------
-- Fija quién y cuándo registró el precio a partir de la sesión: el cliente no puede falsificarlo.
-- También valida que el producto y la sucursal estén activos.
create or replace function public.antes_de_insertar_precio()
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
  if not exists (select 1 from public.productos where id = new.producto_id and activo) then
    raise exception 'El producto % no está activo en el catálogo municipal', new.producto_id
      using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.sucursales where id = new.sucursal_id and activa) then
    raise exception 'La sucursal % no está activa', new.sucursal_id using errcode = 'P0001';
  end if;
  if new.oferta_hasta is not null and new.oferta_hasta < current_date then
    raise exception 'La vigencia de la oferta no puede estar en el pasado' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger precios_antes_de_insertar
before insert on public.precios
for each row execute function public.antes_de_insertar_precio();

-- ---------- Auditoría automática ----------
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fila jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  anterior jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
  quien text;
  detalle text;
begin
  select p.nombre into quien from public.perfiles p where p.id = auth.uid();
  quien := coalesce(quien, case when auth.role() = 'anon' then 'Ciudadano (anónimo)' else 'Sistema' end);

  detalle := case tg_table_name
    when 'precios' then
      format('%s en %s · $%s%s (%s)',
        (select pr.nombre from public.productos pr where pr.id = fila ->> 'producto_id'),
        (select coalesce(c.nombre || ' · ' || s.nombre_sucursal, c.nombre)
           from public.sucursales s join public.comercios c on c.id = s.comercio_id
          where s.id = (fila ->> 'sucursal_id')::bigint),
        to_char((fila ->> 'precio')::int, 'FM999G999G999'),
        case when (fila ->> 'es_oferta')::boolean then ' oferta' else '' end,
        fila ->> 'fuente')
    when 'productos' then
      case
        when tg_op = 'UPDATE' and anterior ->> 'activo' <> fila ->> 'activo' then
          case when (fila ->> 'activo')::boolean then 'Activado: ' else 'Desactivado: ' end || (fila ->> 'nombre')
        else format('Producto %s · %s', fila ->> 'nombre', fila ->> 'unidad')
      end
    when 'sucursales' then
      case
        when tg_op = 'UPDATE' and anterior ->> 'activa' <> fila ->> 'activa' then
          case when (fila ->> 'activa')::boolean then 'Sucursal activada: ' else 'Sucursal desactivada: ' end
          || coalesce(fila ->> 'nombre_sucursal', fila ->> 'direccion')
        else format('Sucursal %s · %s', coalesce(fila ->> 'nombre_sucursal', '(sin nombre)'), fila ->> 'direccion')
      end
    when 'comercios' then format('Comercio %s', fila ->> 'nombre')
    when 'perfiles' then
      case
        when tg_op = 'UPDATE' and anterior ->> 'activo' <> fila ->> 'activo' then
          case when (fila ->> 'activo')::boolean then 'Cuenta activada: ' else 'Cuenta desactivada: ' end || (fila ->> 'nombre')
        else format('Usuario %s (%s)', fila ->> 'nombre', fila ->> 'rol')
      end
    when 'reportes' then
      format('Reporte ciudadano (sucursal %s): %s', fila ->> 'sucursal_id', fila ->> 'motivo')
    when 'solicitudes_comerciante' then
      case fila ->> 'estado'
        when 'pendiente' then 'Solicitud de registro: '
        when 'aprobada' then 'Cuenta aprobada: '
        else 'Solicitud rechazada: '
      end || (fila ->> 'comercio')
    else ''
  end;

  insert into public.auditoria (usuario_id, usuario_nombre, tabla, operacion, registro_id, detalle)
  values (auth.uid(), quien, tg_table_name, tg_op, fila ->> 'id', coalesce(detalle, ''));

  return null;
end;
$$;

create trigger auditoria_precios after insert or update or delete on public.precios
for each row execute function public.registrar_auditoria();
create trigger auditoria_productos after insert or update or delete on public.productos
for each row execute function public.registrar_auditoria();
create trigger auditoria_sucursales after insert or update or delete on public.sucursales
for each row execute function public.registrar_auditoria();
create trigger auditoria_comercios after insert or update or delete on public.comercios
for each row execute function public.registrar_auditoria();
create trigger auditoria_perfiles after insert or update or delete on public.perfiles
for each row execute function public.registrar_auditoria();
create trigger auditoria_reportes after insert on public.reportes
for each row execute function public.registrar_auditoria();
create trigger auditoria_solicitudes after insert or update on public.solicitudes_comerciante
for each row execute function public.registrar_auditoria();

-- ---------- Protección de campos sensibles ----------
-- Un comerciante puede editar sus sucursales, pero no moverlas a otro comercio.
create or replace function public.proteger_sucursal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.comercio_id <> old.comercio_id and not public.es_admin() then
    raise exception 'No puedes mover una sucursal a otro comercio' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger sucursales_proteger before update on public.sucursales
for each row execute function public.proteger_sucursal();

-- Nadie (salvo un administrador) puede cambiar su propio rol, email o estado.
create or replace function public.proteger_perfil()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.es_admin() and (new.rol <> old.rol or new.activo <> old.activo or new.email <> old.email) then
    raise exception 'Solo un administrador puede cambiar el rol, el email o el estado de una cuenta'
      using errcode = '42501';
  end if;
  if old.id = auth.uid() and new.activo = false then
    raise exception 'No puedes desactivar tu propia cuenta' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger perfiles_proteger before update on public.perfiles
for each row execute function public.proteger_perfil();

-- ---------- RPC: aprobar / rechazar solicitudes de comerciantes ----------
-- Se ejecutan en una transacción: aprobar activa la cuenta y crea el comercio con su propietario.
create or replace function public.aprobar_solicitud(p_solicitud_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.solicitudes_comerciante;
  nuevo_comercio bigint;
begin
  if not public.es_admin() then
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
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
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

-- ---------- RPC: registrar una captura del fiscalizador con sus precios (atómico) ----------
-- p_items: [{"producto_id": "arroz", "precio": 1290}, ...]
create or replace function public.registrar_captura(p_sucursal_id bigint, p_modo public.modo_captura, p_items jsonb)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  nueva_captura bigint;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La captura debe incluir al menos un precio' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 200 then
    raise exception 'Máximo 200 precios por captura' using errcode = '22023';
  end if;

  insert into public.capturas (sucursal_id, modo) values (p_sucursal_id, p_modo)
  returning id into nueva_captura;

  insert into public.precios (producto_id, sucursal_id, precio, fuente, captura_id)
  select i ->> 'producto_id',
         p_sucursal_id,
         (i ->> 'precio')::int,
         case when p_modo = 'ocr' then 'ocr'::public.fuente_precio else 'fiscalizador'::public.fuente_precio end,
         nueva_captura
    from jsonb_array_elements(p_items) as i;

  return nueva_captura;
end;
$$;

-- Las funciones no deben ser ejecutables por cualquiera salvo las que la app necesita.
revoke execute on function public.aprobar_solicitud(bigint) from public, anon;
revoke execute on function public.rechazar_solicitud(bigint) from public, anon;
revoke execute on function public.registrar_captura(bigint, public.modo_captura, jsonb) from public, anon;
grant execute on function public.aprobar_solicitud(bigint) to authenticated;
grant execute on function public.rechazar_solicitud(bigint) to authenticated;
grant execute on function public.registrar_captura(bigint, public.modo_captura, jsonb) to authenticated;
