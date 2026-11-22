// Pruebas de integración: integridad referencial y validaciones de la base de datos.
// Ejecutar: npm run test:integracion
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { CUENTAS, SUCURSAL_PROPIA, anonimo, conSesion, evidencia } from './helpers.mjs';

describe('Integridad referencial y restricciones', () => {
  let comerciante;
  let fiscalizador;
  let admin;
  const insertados = [];

  before(async () => {
    [comerciante, fiscalizador, admin] = await Promise.all([
      conSesion(CUENTAS.comerciante),
      conSesion(CUENTAS.fiscalizador),
      conSesion(CUENTAS.admin),
    ]);
  });

  after(async () => {
    // Limpieza: solo el administrador puede borrar precios (el historial es inmutable para el resto).
    if (insertados.length) await admin.from('precios').delete().in('id', insertados);
  });

  it('un precio válido queda asociado a un producto y una sucursal existentes', async () => {
    const { data, error } = await comerciante
      .from('precios')
      .insert({ producto_id: 'arroz', sucursal_id: SUCURSAL_PROPIA, precio: 1270, fuente: 'comerciante' })
      .select('id, precio, productos(nombre), sucursales(nombre_sucursal, comercios(nombre))')
      .single();
    assert.equal(error, null);
    insertados.push(data.id);
    assert.equal(data.productos.nombre, 'Arroz grado 1');
    assert.equal(data.sucursales.comercios.nombre, 'Minimarket El Sol');
    evidencia('Precio con producto y sucursal', data);
  });

  it('rechaza un precio con un producto inexistente (clave foránea, 23503)', async () => {
    const { error } = await comerciante
      .from('precios')
      .insert({ producto_id: 'producto-inexistente', sucursal_id: SUCURSAL_PROPIA, precio: 1000, fuente: 'comerciante' });
    assert.equal(error?.code, '23503');
    assert.match(error.message, /precios_producto_id_fkey/);
    evidencia('Producto inexistente', `${error.code} · ${error.message}`);
  });

  it('rechaza una captura en una sucursal inexistente (clave foránea, 23503)', async () => {
    const { error } = await fiscalizador.from('capturas').insert({ sucursal_id: 99999, modo: 'manual' });
    assert.equal(error?.code, '23503');
    assert.match(error.message, /capturas_sucursal_id_fkey/);
    evidencia('Sucursal inexistente', `${error.code} · ${error.message}`);
  });

  it('rechaza un reporte ciudadano sobre una sucursal inexistente (clave foránea, 23503)', async () => {
    const { error } = await anonimo().from('reportes').insert({ sucursal_id: 99999, motivo: 'Precio distinto' });
    assert.equal(error?.code, '23503');
    evidencia('Reporte con sucursal inexistente', `${error.code} · ${error.message}`);
  });

  it('rechaza precios negativos, cero o absurdos (CHECK, 23514)', async () => {
    for (const precio of [-500, 0, 99999999]) {
      const { error } = await comerciante
        .from('precios')
        .insert({ producto_id: 'arroz', sucursal_id: SUCURSAL_PROPIA, precio, fuente: 'comerciante' });
      assert.equal(error?.code, '23514', `precio ${precio}`);
    }
    evidencia('Precio -500', 'rechazado por precios_precio_check (23514)');
  });

  it('rechaza una fecha de vigencia sin oferta (CHECK, 23514)', async () => {
    const { error } = await comerciante.from('precios').insert({
      producto_id: 'arroz',
      sucursal_id: SUCURSAL_PROPIA,
      precio: 1200,
      es_oferta: false,
      oferta_hasta: '2099-01-01',
      fuente: 'comerciante',
    });
    assert.equal(error?.code, '23514');
    assert.match(error.message, /precios_oferta_hasta_solo_en_oferta/);
  });

  it('la función es_rut_valido de la base de datos valida el dígito verificador', async () => {
    const { data: valido } = await anonimo().rpc('es_rut_valido', { rut: '76.999.888-8' });
    const { data: invalido } = await anonimo().rpc('es_rut_valido', { rut: '76.999.888-1' });
    assert.equal(valido, true);
    assert.equal(invalido, false);
  });

  it('la captura del fiscalizador guarda captura y precios en una transacción', async () => {
    const { data: capturaId, error } = await fiscalizador.rpc('registrar_captura', {
      p_sucursal_id: 2,
      p_modo: 'manual',
      p_items: [{ producto_id: 'leche', precio: 1090 }],
    });
    assert.equal(error, null);
    const { data: precios } = await fiscalizador.from('precios').select('id, captura_id, fuente').eq('captura_id', capturaId);
    assert.equal(precios.length, 1);
    assert.equal(precios[0].fuente, 'fiscalizador');
    insertados.push(precios[0].id);

    // Si un precio es inválido, no se guarda nada (ni la captura).
    const { error: errorTx } = await fiscalizador.rpc('registrar_captura', {
      p_sucursal_id: 2,
      p_modo: 'manual',
      p_items: [
        { producto_id: 'pan', precio: 1400 },
        { producto_id: 'no-existe', precio: 100 },
      ],
    });
    assert.equal(errorTx?.code, '23503');
    const { count } = await fiscalizador
      .from('precios')
      .select('id', { count: 'exact', head: true })
      .eq('sucursal_id', 2)
      .eq('producto_id', 'pan')
      .gte('registrado_en', new Date(Date.now() - 60000).toISOString());
    assert.equal(count, 0);
    evidencia('Transacción revertida', 'la captura con un producto inexistente no dejó precios parciales');
  });
});
