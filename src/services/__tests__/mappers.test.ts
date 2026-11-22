import { describe, expect, it } from '@jest/globals';

import { friendlyError, toAudit, toIsoDate, toPriceEntry, toStore, type StoreRow } from '../mappers';

const storeRow: StoreRow = {
  id: 7,
  comercio_id: 7,
  nombre_sucursal: 'Sucursal Principal',
  direccion: 'Av. Departamental 2450',
  horario: 'Lun–Dom 8:00–22:00',
  telefono: '+56 2 2555 0101',
  lat: -33.493,
  lng: -70.676,
  mapa_x: 54,
  mapa_y: 72,
  beneficio_tarjeta_vecina: '5% de descuento',
  activa: true,
  creado_en: '2026-11-21T00:00:00Z',
  comercios: { nombre: 'Minimarket El Sol', tipo: 'minimarket', propietario_id: 'uuid-comerciante' },
};

describe('Conversión de filas de la base de datos a tipos de la app', () => {
  it('convierte una sucursal con su comercio y dueño', () => {
    const store = toStore(storeRow);
    expect(store).toMatchObject({
      id: 7,
      name: 'Minimarket El Sol',
      branch: 'Sucursal Principal',
      type: 'minimarket',
      map: { x: 54, y: 72 },
      merchant: 'Minimarket El Sol',
      ownerId: 'uuid-comerciante',
      comercioId: 7,
      active: true,
    });
  });

  it('una sucursal sin dueño no tiene comerciante asociado', () => {
    const store = toStore({ ...storeRow, comercios: { nombre: 'Feria', tipo: 'feria', propietario_id: null } });
    expect(store.merchant).toBeUndefined();
    expect(store.ownerId).toBeUndefined();
  });

  it('descarta filas incompletas de la vista precios_vigentes', () => {
    const base = {
      id: 1,
      producto_id: 'arroz',
      sucursal_id: 3,
      precio: 1190,
      es_oferta: true,
      oferta_hasta: null,
      fuente: 'comerciante' as const,
      registrado_en: '2026-11-21T12:00:00Z',
    };
    expect(toPriceEntry(base)).toMatchObject({ storeId: 3, productId: 'arroz', price: 1190, offer: true });
    expect(toPriceEntry({ ...base, precio: null })).toBeNull();
  });

  it('agrupa las tablas de la auditoría como las muestra la app', () => {
    const entry = toAudit({
      id: 5,
      fecha: '2026-11-21T12:00:00Z',
      usuario_id: null,
      usuario_nombre: 'Benjamín',
      tabla: 'perfiles',
      operacion: 'UPDATE',
      registro_id: 'x',
      detalle: 'Cuenta activada: María',
    });
    expect(entry.table).toBe('usuarios');
    expect(entry.operation).toBe('UPDATE');
  });
});

describe('Fechas del formulario de ofertas', () => {
  it('convierte dd-mm-aaaa a aaaa-mm-dd', () => {
    expect(toIsoDate('5-12-2026')).toBe('2026-12-05');
    expect(toIsoDate('31/12/2026')).toBe('2026-12-31');
  });

  it('rechaza fechas inexistentes o mal escritas', () => {
    expect(toIsoDate('31-02-2026')).toBeNull();
    expect(toIsoDate('2026-12-05')).toBeNull();
    expect(toIsoDate('')).toBeNull();
    expect(toIsoDate(undefined)).toBeNull();
  });
});

describe('Mensajes de error para la persona usuaria', () => {
  it('traduce los códigos de Postgres', () => {
    expect(friendlyError({ code: '42501', message: 'new row violates row-level security policy for table "precios"' })).toBe(
      'No tienes permiso para realizar esta operación',
    );
    expect(friendlyError({ code: '23503', message: 'insert or update on table "precios" violates foreign key' })).toMatch(/no existe/);
    expect(friendlyError({ code: '23514', message: 'violates check constraint' })).toMatch(/validación/);
    expect(friendlyError({ code: '23505', message: 'duplicate key' })).toMatch(/Ya existe/);
  });

  it('muestra el mensaje propio de las validaciones de la base de datos', () => {
    expect(friendlyError({ code: 'P0001', message: 'La sucursal 99 no está activa' })).toBe('La sucursal 99 no está activa');
  });

  it('detecta la falta de conexión', () => {
    expect(friendlyError({ message: 'TypeError: Failed to fetch' })).toMatch(/Sin conexión/);
  });
});
