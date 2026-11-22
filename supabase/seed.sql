-- =====================================================================
-- Observatorio de Precios PAC · Datos de prueba
-- Reproduce los datos de ejemplo de la app (src/data/*.ts) en la base de datos.
-- Las contraseñas de las cuentas de prueba son "demo1234" (solo para la demo, no son credenciales reales).
-- Se puede ejecutar varias veces: primero limpia las tablas.
-- =====================================================================

begin;

truncate public.auditoria, public.eventos_app, public.precios, public.capturas, public.reportes,
  public.solicitudes_comerciante, public.sucursales, public.comercios, public.productos,
  public.categorias, public.perfiles restart identity cascade;
delete from auth.identities where user_id in (select id from auth.users where email like '%@demo.cl' or email like '%@ejemplo.cl');
delete from auth.users where email like '%@demo.cl' or email like '%@ejemplo.cl';

-- ---------- Cuentas (Supabase Auth) ----------
with cuentas (id, email) as (
  values
    ('00000000-0000-4000-a000-000000000001'::uuid, 'admin@demo.cl'),
    ('00000000-0000-4000-a000-000000000002'::uuid, 'fiscalizador@demo.cl'),
    ('00000000-0000-4000-a000-000000000003'::uuid, 'comercio@demo.cl'),
    ('00000000-0000-4000-a000-000000000004'::uuid, 'superpac@demo.cl'),
    ('00000000-0000-4000-a000-000000000005'::uuid, 'csoto@demo.cl'),
    ('00000000-0000-4000-a000-000000000006'::uuid, 'rperez@demo.cl'),
    ('00000000-0000-4000-a000-000000000011'::uuid, 'laespiga@ejemplo.cl'),
    ('00000000-0000-4000-a000-000000000012'::uuid, 'donlucho@ejemplo.cl'),
    ('00000000-0000-4000-a000-000000000013'::uuid, 'sanjoaquin@ejemplo.cl')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
       extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
       '', '', '', ''
  from cuentas;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
  from auth.users u
 where u.email like '%@demo.cl' or u.email like '%@ejemplo.cl';

insert into public.perfiles (id, nombre, email, rol, activo) values
  ('00000000-0000-4000-a000-000000000001', 'Benjamín', 'admin@demo.cl', 'admin', true),
  ('00000000-0000-4000-a000-000000000002', 'Javier', 'fiscalizador@demo.cl', 'fiscalizador', true),
  ('00000000-0000-4000-a000-000000000003', 'Minimarket El Sol', 'comercio@demo.cl', 'comerciante', true),
  ('00000000-0000-4000-a000-000000000004', 'Supermercado PAC', 'superpac@demo.cl', 'comerciante', true),
  ('00000000-0000-4000-a000-000000000005', 'Camila Soto', 'csoto@demo.cl', 'fiscalizador', true),
  ('00000000-0000-4000-a000-000000000006', 'Rodrigo Pérez', 'rperez@demo.cl', 'fiscalizador', false),
  -- Comerciantes que se registraron y esperan aprobación (cuenta inactiva).
  ('00000000-0000-4000-a000-000000000011', 'María Fuentes', 'laespiga@ejemplo.cl', 'comerciante', false),
  ('00000000-0000-4000-a000-000000000012', 'Luis Contreras', 'donlucho@ejemplo.cl', 'comerciante', false),
  ('00000000-0000-4000-a000-000000000013', 'Carolina Rojas', 'sanjoaquin@ejemplo.cl', 'comerciante', false);

-- ---------- Catálogo municipal ----------
insert into public.categorias (id, nombre) values
  ('abarrotes', 'Abarrotes'),
  ('lacteos', 'Lácteos y huevos'),
  ('panaderia', 'Panadería'),
  ('carnes', 'Carnes'),
  ('frutas', 'Frutas y verduras');

insert into public.productos (id, nombre, unidad, categoria_id, palabras_clave) values
  ('arroz', 'Arroz grado 1', '1 kg', 'abarrotes', '{arroz}'),
  ('aceite', 'Aceite vegetal', '1 L', 'abarrotes', '{aceite,maravilla}'),
  ('azucar', 'Azúcar granulada', '1 kg', 'abarrotes', '{azucar}'),
  ('harina', 'Harina', '1 kg', 'abarrotes', '{harina}'),
  ('fideos', 'Fideos spaghetti', '400 g', 'abarrotes', '{fideos,tallarines,pasta}'),
  ('leche', 'Leche entera', '1 L', 'lacteos', '{leche}'),
  ('huevos', 'Huevos blancos', '12 un', 'lacteos', '{huevo,huevos}'),
  ('pan', 'Pan marraqueta', 'kg', 'panaderia', '{pan,marraqueta,batido}'),
  ('pollo', 'Pollo entero', 'kg', 'carnes', '{pollo}'),
  ('carne', 'Carne molida', 'kg', 'carnes', '{carne,vacuno,molida}'),
  ('tomate', 'Tomate', 'kg', 'frutas', '{tomate}'),
  ('papa', 'Papa', 'kg', 'frutas', '{papa,papas}'),
  ('cebolla', 'Cebolla', 'kg', 'frutas', '{cebolla}'),
  ('zanahoria', 'Zanahoria', 'kg', 'frutas', '{zanahoria}');

-- ---------- Comercios y sucursales ----------
insert into public.comercios (id, nombre, rut_empresa, tipo, propietario_id) values
  (1, 'Abarrotes Don José', '76.111.222-8', 'almacen', null),
  (2, 'Minimarket La Esquina', '76.222.333-3', 'minimarket', null),
  (3, 'Supermercado PAC', '76.333.444-9', 'supermercado', '00000000-0000-4000-a000-000000000004'),
  (4, 'Almacén Doña Rosa', '76.444.555-4', 'almacen', null),
  (5, 'Comercial Los Andes', '76.555.666-K', 'minimarket', null),
  (6, 'Feria Lo Valledor', null, 'feria', null),
  (7, 'Minimarket El Sol', '76.777.888-0', 'minimarket', '00000000-0000-4000-a000-000000000003');
select setval(pg_get_serial_sequence('public.comercios', 'id'), (select max(id) from public.comercios));

insert into public.sucursales
  (id, comercio_id, nombre_sucursal, direccion, horario, telefono, lat, lng, mapa_x, mapa_y, beneficio_tarjeta_vecina) values
  (1, 1, null, 'Av. Departamental 1450', 'Lun–Sáb 8:00–20:00 · Dom 9:00–14:00', null, -33.4901, -70.6742, 25, 30, '5% de descuento en abarrotes'),
  (2, 2, null, 'Calle Ochagavía 890', 'Lun–Dom 7:30–22:00', null, -33.4945, -70.6798, 48, 40, null),
  (3, 3, null, 'Av. Central 320', 'Lun–Dom 8:00–21:00', null, -33.4912, -70.6815, 60, 28, null),
  (4, 4, null, 'Pasaje Los Maitenes 45', 'Lun–Sáb 9:00–19:00', null, -33.4968, -70.6725, 35, 62, '10% de descuento en pan y lácteos'),
  (5, 5, null, 'Av. Lo Ovalle 2100', 'Lun–Sáb 8:30–20:30 · Dom cerrado', null, -33.4889, -70.6688, 75, 45, null),
  (6, 6, 'Puesto 12', 'Mercado Lo Valledor', 'Mar–Dom 6:00–15:00', null, -33.4995, -70.6832, 20, 78, '8% de descuento en frutas y verduras'),
  (7, 7, 'Sucursal Principal', 'Av. Departamental 2450', 'Lun–Dom 8:00–22:00', '+56 2 2555 0101', -33.493, -70.676, 54, 72, '5% de descuento en toda la compra'),
  (8, 7, 'Sucursal Norte', 'Av. Lo Ovalle 980', 'Lun–Sáb 9:00–21:00', '+56 2 2555 0102', -33.488, -70.68, 88, 62, '5% de descuento en toda la compra');
select setval(pg_get_serial_sequence('public.sucursales', 'id'), (select max(id) from public.sucursales));

-- ---------- Precios: valores actuales y ~30 días de historial ----------
-- (sucursal, producto, precio, oferta, días desde la última actualización, fuente)
create temporary table precios_actuales (
  sucursal_id bigint, producto_id text, precio int, es_oferta boolean, dias int, fuente public.fuente_precio
) on commit drop;

insert into precios_actuales values
  (1, 'arroz', 1290, false, 0, 'fiscalizador'), (1, 'aceite', 1890, false, 1, 'fiscalizador'),
  (1, 'azucar', 990, false, 0, 'fiscalizador'), (1, 'harina', 890, false, 2, 'fiscalizador'),
  (1, 'fideos', 790, false, 1, 'ocr'),
  (2, 'arroz', 1350, false, 0, 'ocr'), (2, 'leche', 1090, false, 0, 'ocr'),
  (2, 'huevos', 1890, false, 1, 'fiscalizador'), (2, 'pan', 1400, false, 0, 'fiscalizador'),
  (2, 'fideos', 850, false, 2, 'fiscalizador'),
  (3, 'arroz', 1190, true, 0, 'comerciante'), (3, 'aceite', 1750, true, 0, 'comerciante'),
  (3, 'leche', 990, true, 0, 'comerciante'), (3, 'azucar', 950, false, 1, 'carga'),
  (3, 'pollo', 2490, false, 0, 'carga'), (3, 'fideos', 690, true, 0, 'carga'),
  (3, 'huevos', 1990, false, 1, 'carga'), (3, 'carne', 5990, false, 1, 'carga'),
  (4, 'arroz', 1420, false, 3, 'fiscalizador'), (4, 'pan', 1300, true, 0, 'ocr'),
  (4, 'tomate', 890, false, 0, 'ocr'), (4, 'papa', 690, false, 1, 'ocr'),
  (4, 'cebolla', 790, false, 1, 'fiscalizador'),
  (5, 'arroz', 1250, false, 0, 'fiscalizador'), (5, 'aceite', 1950, false, 1, 'fiscalizador'),
  (5, 'leche', 1150, false, 0, 'ocr'), (5, 'huevos', 1750, false, 0, 'ocr'),
  (5, 'harina', 950, false, 2, 'fiscalizador'),
  (6, 'tomate', 750, true, 0, 'ocr'), (6, 'papa', 590, true, 0, 'ocr'),
  (6, 'cebolla', 690, false, 0, 'ocr'), (6, 'pollo', 2290, true, 0, 'fiscalizador'),
  (6, 'zanahoria', 590, false, 0, 'ocr'),
  (7, 'arroz', 1290, false, 0, 'comerciante'), (7, 'aceite', 2490, true, 1, 'comerciante'),
  (7, 'leche', 1050, false, 3, 'comerciante'), (7, 'pan', 1200, false, 0, 'ocr'),
  (7, 'huevos', 2490, false, 1, 'ocr'), (7, 'azucar', 1150, false, 1, 'ocr'),
  (8, 'arroz', 1320, false, 1, 'carga'), (8, 'leche', 1050, false, 3, 'carga'),
  (8, 'fideos', 820, false, 1, 'carga'), (8, 'pan', 1350, false, 1, 'carga');

-- Quién registró cada fuente en la demo.
create temporary table autor_fuente (sucursal_id bigint, fuente public.fuente_precio, autor uuid) on commit drop;
insert into autor_fuente
select s.id, f.fuente,
       case
         when f.fuente in ('fiscalizador', 'ocr') then '00000000-0000-4000-a000-000000000002'::uuid
         else c.propietario_id
       end
  from public.sucursales s
  join public.comercios c on c.id = s.comercio_id
 cross join unnest(enum_range(null::public.fuente_precio)) as f(fuente);

-- Historial: 5 observaciones anteriores con una tendencia y ruido deterministas (como src/data/seed.ts).
insert into public.precios (producto_id, sucursal_id, precio, es_oferta, fuente, registrado_por, registrado_en)
select a.producto_id, a.sucursal_id,
       greatest(10, round((a.precio * (1 - t.drift * (1 - h.i / 5.0)) + t.ruido * a.precio) / 10) * 10)::int,
       false, a.fuente, af.autor,
       date_trunc('day', now()) - make_interval(days => h.dias) + make_interval(hours => 10 + h.i)
  from precios_actuales a
  join autor_fuente af on af.sucursal_id = a.sucursal_id and af.fuente = a.fuente
 cross join lateral (
   select ((abs(hashtext(a.sucursal_id || a.producto_id)) % 1000) / 1000.0 - 0.6) * 0.18 as drift,
          ((abs(hashtext(a.producto_id || a.sucursal_id)) % 100) / 100.0 - 0.5) * 0.04 as ruido
 ) t
 cross join lateral (values (0, 30), (1, 24), (2, 18), (3, 12), (4, 6)) as h(i, dias)
 where h.dias > a.dias + 1;

-- Precio actual (el más reciente de cada producto y sucursal).
insert into public.precios (producto_id, sucursal_id, precio, es_oferta, fuente, registrado_por, registrado_en)
select a.producto_id, a.sucursal_id, a.precio, a.es_oferta, a.fuente, af.autor,
       least(now() - interval '5 minutes',
             date_trunc('day', now()) - make_interval(days => a.dias) + make_interval(hours => 9 + (a.sucursal_id % 8)::int))
  from precios_actuales a
  join autor_fuente af on af.sucursal_id = a.sucursal_id and af.fuente = a.fuente;

-- ---------- Capturas del fiscalizador ----------
insert into public.capturas (sucursal_id, fiscalizador_id, modo, creado_en) values
  (7, '00000000-0000-4000-a000-000000000002', 'ocr', date_trunc('day', now()) + interval '9 hours 42 minutes'),
  (4, '00000000-0000-4000-a000-000000000002', 'ocr', date_trunc('day', now()) + interval '10 hours 15 minutes'),
  (6, '00000000-0000-4000-a000-000000000002', 'ocr', date_trunc('day', now()) + interval '11 hours 3 minutes'),
  (2, '00000000-0000-4000-a000-000000000002', 'manual', date_trunc('day', now()) - interval '1 day' + interval '16 hours 40 minutes'),
  (5, '00000000-0000-4000-a000-000000000002', 'manual', date_trunc('day', now()) - interval '3 days' + interval '11 hours 20 minutes'),
  (1, '00000000-0000-4000-a000-000000000002', 'ocr', date_trunc('day', now()) - interval '7 days' + interval '15 hours 5 minutes');
update public.capturas set creado_en = least(creado_en, now() - interval '10 minutes');

-- Asocia los precios del fiscalizador del mismo día a su captura.
update public.precios p
   set captura_id = c.id
  from public.capturas c
 where p.sucursal_id = c.sucursal_id
   and p.fuente in ('fiscalizador', 'ocr')
   and date_trunc('day', p.registrado_en) = date_trunc('day', c.creado_en);

-- ---------- Solicitudes de comerciantes pendientes ----------
-- Nota: el RUT de "Almacén San Joaquín" en src/data/seed.ts (76.999.888-1) tenía mal el dígito
-- verificador; la restricción CHECK lo rechazó y se corrigió a 76.999.888-8.
insert into public.solicitudes_comerciante (usuario_id, comercio, rut_empresa, tipo, telefono, nombre, email, rut, creado_en) values
  ('00000000-0000-4000-a000-000000000011', 'Panadería La Espiga', '76.543.210-3', 'panaderia', '+56 9 5555 1201', 'María Fuentes', 'laespiga@ejemplo.cl', '12.345.678-5', now() - interval '1 day 6 hours'),
  ('00000000-0000-4000-a000-000000000012', 'Carnicería Don Lucho', '77.111.222-6', 'carniceria', '+56 9 5555 3402', 'Luis Contreras', 'donlucho@ejemplo.cl', '9.876.543-3', now() - interval '2 days 3 hours'),
  ('00000000-0000-4000-a000-000000000013', 'Almacén San Joaquín', '76.999.888-8', 'almacen', '+56 9 5555 7703', 'Carolina Rojas', 'sanjoaquin@ejemplo.cl', '15.432.109-8', now() - interval '4 days 2 hours');

-- ---------- Auditoría inicial ----------
-- Los triggers registraron la carga de datos como "Sistema"; se reemplaza por un historial legible.
truncate public.auditoria restart identity;
insert into public.auditoria (fecha, usuario_id, usuario_nombre, tabla, operacion, detalle) values
  (now() - interval '3 days', '00000000-0000-4000-a000-000000000001', 'Benjamín', 'perfiles', 'UPDATE', 'Cuenta desactivada: Rodrigo Pérez'),
  (now() - interval '2 days', '00000000-0000-4000-a000-000000000001', 'Benjamín', 'sucursales', 'UPDATE', 'Sucursal Puesto 12 · Mercado Lo Valledor'),
  (now() - interval '1 day', '00000000-0000-4000-a000-000000000003', 'Minimarket El Sol', 'precios', 'INSERT', 'Carga masiva · 4 precios en Sucursal Norte'),
  (now() - interval '1 day', '00000000-0000-4000-a000-000000000001', 'Benjamín', 'productos', 'INSERT', 'Producto Zanahoria · kg'),
  (now() - interval '3 hours', '00000000-0000-4000-a000-000000000004', 'Supermercado PAC', 'precios', 'INSERT', 'Arroz grado 1 en Supermercado PAC · $1.190 oferta (comerciante)'),
  (now() - interval '2 hours', '00000000-0000-4000-a000-000000000002', 'Javier', 'precios', 'INSERT', 'Captura OCR en Minimarket El Sol · Sucursal Principal'),
  (now() - interval '1 hour', '00000000-0000-4000-a000-000000000002', 'Javier', 'precios', 'INSERT', 'Captura OCR en Feria Lo Valledor · Puesto 12');

commit;
