-- =====================================================================
-- Observatorio de Precios PAC · Migración 4: Row Level Security (autorización por rol)
-- =====================================================================
-- Roles de Supabase: "anon" = ciudadano sin cuenta; "authenticated" = cualquier cuenta con sesión.
-- El rol de negocio (admin / fiscalizador / comerciante) se lee de public.perfiles con rol_actual().

alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.comercios enable row level security;
alter table public.sucursales enable row level security;
alter table public.capturas enable row level security;
alter table public.precios enable row level security;
alter table public.reportes enable row level security;
alter table public.solicitudes_comerciante enable row level security;
alter table public.auditoria enable row level security;
alter table public.eventos_app enable row level security;

-- ---------- perfiles ----------
create policy "Cada usuario ve su propio perfil" on public.perfiles
  for select to authenticated using (id = (select auth.uid()));
create policy "El administrador ve todos los perfiles" on public.perfiles
  for select to authenticated using ((select public.es_admin()));
create policy "El administrador actualiza perfiles" on public.perfiles
  for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
-- Las cuentas se crean desde las Edge Functions (service role), nunca desde el cliente.

-- ---------- catálogo (lectura pública) ----------
create policy "Todos leen las categorías" on public.categorias
  for select to anon, authenticated using (true);
create policy "El administrador gestiona categorías" on public.categorias
  for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));

create policy "Todos leen los productos activos" on public.productos
  for select to anon, authenticated using (activo or (select public.es_admin()));
create policy "El administrador crea productos" on public.productos
  for insert to authenticated with check ((select public.es_admin()));
create policy "El administrador actualiza productos" on public.productos
  for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));

-- ---------- comercios y sucursales ----------
create policy "Todos leen los comercios" on public.comercios
  for select to anon, authenticated using (true);
create policy "El administrador gestiona comercios" on public.comercios
  for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "El comerciante actualiza su comercio" on public.comercios
  for update to authenticated
  using (propietario_id = (select auth.uid()) and (select public.rol_actual()) = 'comerciante')
  with check (propietario_id = (select auth.uid()));

create policy "Todos leen las sucursales activas" on public.sucursales
  for select to anon, authenticated
  using (activa or (select public.es_personal_municipal()) or public.es_duenio_comercio(comercio_id));
create policy "El administrador gestiona sucursales" on public.sucursales
  for all to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "El comerciante crea sucursales de su comercio" on public.sucursales
  for insert to authenticated with check (public.es_duenio_comercio(comercio_id));
create policy "El comerciante actualiza sus sucursales" on public.sucursales
  for update to authenticated
  using (public.es_duenio_comercio(comercio_id))
  with check (public.es_duenio_comercio(comercio_id));

-- ---------- precios ----------
create policy "Todos leen los precios" on public.precios
  for select to anon, authenticated using (true);
create policy "Fiscalizadores y administradores registran precios" on public.precios
  for insert to authenticated
  with check ((select public.es_personal_municipal()) and fuente in ('fiscalizador', 'ocr'));
create policy "El comerciante registra precios solo en sus sucursales" on public.precios
  for insert to authenticated
  with check (public.es_duenio_sucursal(sucursal_id) and fuente in ('comerciante', 'carga'));
create policy "Solo el administrador corrige precios" on public.precios
  for delete to authenticated using ((select public.es_admin()));
-- No hay política UPDATE: el historial de precios es inmutable.

-- ---------- capturas ----------
create policy "El fiscalizador ve sus capturas y el administrador todas" on public.capturas
  for select to authenticated
  using (fiscalizador_id = (select auth.uid()) or (select public.es_admin()));
create policy "Fiscalizadores registran capturas" on public.capturas
  for insert to authenticated
  with check ((select public.es_personal_municipal()) and fiscalizador_id = (select auth.uid()));

-- ---------- reportes ciudadanos ----------
create policy "Cualquiera puede reportar un precio" on public.reportes
  for insert to anon, authenticated with check (estado = 'pendiente');
create policy "El personal municipal ve los reportes" on public.reportes
  for select to authenticated using ((select public.es_personal_municipal()));
create policy "El administrador gestiona reportes" on public.reportes
  for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));

-- ---------- solicitudes de comerciantes ----------
-- Se crean desde la Edge Function "registro-comerciante" (service role) y se aprueban con RPC.
create policy "El administrador ve las solicitudes" on public.solicitudes_comerciante
  for select to authenticated using ((select public.es_admin()));
create policy "El solicitante ve su propia solicitud" on public.solicitudes_comerciante
  for select to authenticated using (usuario_id = (select auth.uid()));

-- ---------- auditoría y eventos ----------
create policy "Solo el administrador lee la auditoría" on public.auditoria
  for select to authenticated using ((select public.es_admin()));

create policy "La app informa eventos de monitoreo" on public.eventos_app
  for insert to anon, authenticated
  with check (usuario_id is null or usuario_id = (select auth.uid()));
create policy "Solo el administrador lee los eventos" on public.eventos_app
  for select to authenticated using ((select public.es_admin()));

-- ---------- Privilegios de tabla ----------
-- RLS filtra filas; además quitamos lo que ningún cliente debe hacer.
revoke all on public.auditoria from anon, authenticated;
grant select on public.auditoria to authenticated;
revoke update, delete on public.eventos_app from anon, authenticated;
revoke update, delete on public.reportes from anon;
revoke insert, update, delete on public.solicitudes_comerciante from anon, authenticated;
grant select on public.solicitudes_comerciante to authenticated;
revoke insert, delete on public.perfiles from anon, authenticated;
revoke update on public.precios from anon, authenticated;
