// Pruebas de integración: autenticación y autorización por rol (RLS) y validación en el servidor.
// Ejecutar: npm run test:integracion
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { CUENTAS, KEY, SUCURSAL_AJENA, SUCURSAL_PROPIA, URL, anonimo, conSesion, evidencia } from './helpers.mjs';

describe('Autenticación', () => {
  it('rechaza una contraseña incorrecta', async () => {
    const { error } = await anonimo().auth.signInWithPassword({ email: CUENTAS.comerciante, password: 'incorrecta' });
    assert.ok(error);
    evidencia('Login con clave incorrecta', `${error.status} · ${error.code}`);
  });

  it('una cuenta desactivada no obtiene permisos aunque inicie sesión', async () => {
    const db = await conSesion(CUENTAS.inactivo);
    const { error } = await db.rpc('registrar_captura', {
      p_sucursal_id: 1,
      p_modo: 'manual',
      p_items: [{ producto_id: 'arroz', precio: 1290 }],
    });
    assert.equal(error?.code, '42501');
    evidencia('Fiscalizador desactivado', error.message);
  });
});

describe('Autorización del comerciante (RLS)', () => {
  let comerciante;
  let admin;
  const insertados = [];

  before(async () => {
    [comerciante, admin] = await Promise.all([conSesion(CUENTAS.comerciante), conSesion(CUENTAS.admin)]);
  });

  after(async () => {
    if (insertados.length) await admin.from('precios').delete().in('id', insertados);
  });

  it('PERMITIDO: registra un precio en su propia sucursal', async () => {
    const { data, error } = await comerciante
      .from('precios')
      .insert({ producto_id: 'leche', sucursal_id: SUCURSAL_PROPIA, precio: 1040, fuente: 'comerciante' })
      .select('id')
      .single();
    assert.equal(error, null);
    insertados.push(data.id);
    evidencia('Precio en sucursal propia (7)', 'guardado');
  });

  it('DENEGADO: no puede registrar precios en la sucursal de otro comercio', async () => {
    const { error } = await comerciante
      .from('precios')
      .insert({ producto_id: 'leche', sucursal_id: SUCURSAL_AJENA, precio: 1, fuente: 'comerciante' });
    assert.equal(error?.code, '42501');
    assert.match(error.message, /row-level security/);
    evidencia('Precio en sucursal ajena (3)', `${error.code} · ${error.message}`);
  });

  it('DENEGADO: no puede hacerse pasar por fiscalizador (fuente "ocr")', async () => {
    const { error } = await comerciante
      .from('precios')
      .insert({ producto_id: 'leche', sucursal_id: SUCURSAL_PROPIA, precio: 1040, fuente: 'ocr' });
    assert.equal(error?.code, '42501');
  });

  it('PERMITIDO: edita el horario de su sucursal', async () => {
    const { data: antes } = await comerciante.from('sucursales').select('horario').eq('id', SUCURSAL_PROPIA).single();
    const { data, error } = await comerciante
      .from('sucursales')
      .update({ horario: antes.horario })
      .eq('id', SUCURSAL_PROPIA)
      .select('id');
    assert.equal(error, null);
    assert.equal(data.length, 1);
  });

  it('DENEGADO: no puede modificar la sucursal de otro comercio (0 filas afectadas)', async () => {
    const { data, error } = await comerciante
      .from('sucursales')
      .update({ horario: 'Cerrado (hackeado)' })
      .eq('id', SUCURSAL_AJENA)
      .select('id');
    assert.equal(error, null);
    assert.equal(data.length, 0);
    const { data: ajena } = await anonimo().from('sucursales').select('horario').eq('id', SUCURSAL_AJENA).single();
    assert.notEqual(ajena.horario, 'Cerrado (hackeado)');
    evidencia('Editar sucursal ajena (3)', 'RLS filtró la fila: 0 filas actualizadas, el horario no cambió');
  });

  it('DENEGADO: no puede mover su sucursal a otro comercio', async () => {
    const { error } = await comerciante.from('sucursales').update({ comercio_id: 3 }).eq('id', SUCURSAL_PROPIA);
    assert.ok(error);
  });

  it('DENEGADO: no puede cambiar su propio rol a administrador', async () => {
    const { data: auth } = await comerciante.auth.getUser();
    const { data } = await comerciante.from('perfiles').update({ rol: 'admin' }).eq('id', auth.user.id).select('id');
    assert.equal(data?.length ?? 0, 0);
    const { data: perfil } = await comerciante.from('perfiles').select('rol').eq('id', auth.user.id).single();
    assert.equal(perfil.rol, 'comerciante');
  });

  it('DENEGADO: no puede aprobar solicitudes de comerciantes', async () => {
    const { error } = await comerciante.rpc('aprobar_solicitud', { p_solicitud_id: 1 });
    assert.equal(error?.code, '42501');
    evidencia('Comerciante aprueba solicitud', error.message);
  });
});

describe('Datos protegidos para el ciudadano anónimo', () => {
  it('DENEGADO: no puede leer la auditoría', async () => {
    const { error } = await anonimo().from('auditoria').select('id').limit(1);
    assert.equal(error?.code, '42501');
  });

  it('no ve perfiles ni solicitudes (RLS devuelve 0 filas)', async () => {
    const db = anonimo();
    const { data: perfiles } = await db.from('perfiles').select('email');
    const { data: solicitudes } = await db.from('solicitudes_comerciante').select('email');
    assert.equal(perfiles?.length ?? 0, 0);
    assert.equal(solicitudes?.length ?? 0, 0);
  });

  it('DENEGADO: no puede registrar precios', async () => {
    const { error } = await anonimo()
      .from('precios')
      .insert({ producto_id: 'arroz', sucursal_id: 1, precio: 1, fuente: 'fiscalizador' });
    assert.equal(error?.code, '42501');
  });

  it('PERMITIDO: lee el comparador de precios vigentes', async () => {
    const { data, error } = await anonimo().from('precios_vigentes').select('sucursal_id, precio').eq('producto_id', 'arroz');
    assert.equal(error, null);
    assert.ok(data.length >= 7);
  });
});

describe('Validación en el servidor (Edge Functions)', () => {
  const llamar = (fn, body, token) =>
    fetch(`${URL}/functions/v1/${fn}`, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });

  it('registro-comerciante rechaza un RUT inválido con un mensaje por campo', async () => {
    const res = await llamar('registro-comerciante', {
      nombre: 'Prueba Automática',
      email: 'prueba.rut@ejemplo.cl',
      rut: '12.345.678-9',
      password: 'segura123',
      comercio: 'Comercio de prueba',
      rutEmpresa: '76.999.888-1',
      tipo: 'almacen',
      telefono: '+56 9 1234 5678',
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.ok(body.campos.rut);
    assert.ok(body.campos.rutEmpresa);
    evidencia('Respuesta 400', body);
  });

  it('registro-comerciante rechaza contraseñas cortas, emails y teléfonos inválidos', async () => {
    const res = await llamar('registro-comerciante', {
      nombre: 'X',
      email: 'no-es-email',
      rut: '12.345.678-5',
      password: '123',
      comercio: 'Comercio',
      rutEmpresa: '76.543.210-3',
      tipo: 'tienda-inventada',
      telefono: 'abc',
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(body.campos).sort(), ['email', 'nombre', 'password', 'telefono', 'tipo']);
  });

  it('admin-usuarios responde 403 si quien llama no es administrador', async () => {
    const comerciante = await conSesion(CUENTAS.comerciante);
    const { data } = await comerciante.auth.getSession();
    const res = await llamar('admin-usuarios', { nombre: 'Intruso', email: 'intruso@ejemplo.cl', rol: 'admin' }, data.session.access_token);
    assert.equal(res.status, 403);
    evidencia('Comerciante intenta crear un admin', `${res.status} · ${(await res.json()).error}`);
  });

  it('admin-usuarios responde 401 sin sesión', async () => {
    const res = await llamar('admin-usuarios', { nombre: 'X', email: 'x@ejemplo.cl', rol: 'admin' });
    assert.equal(res.status, 401);
  });
});
