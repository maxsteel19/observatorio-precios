// Conversión entre las filas de la base de datos (español, snake_case) y los tipos de la app.
// Son funciones puras: no hacen consultas, por eso se prueban con pruebas unitarias.
import type { Category, Product } from '@/data/catalog';
import type { AppUser, AuditEntry, Capture, CitizenReport, PendingMerchant, PriceEntry, PriceLogEntry } from '@/data/seed';
import type { Store } from '@/data/stores';

import type { Tables } from './database.types';

export type StoreRow = Tables<'sucursales'> & {
  comercios: Pick<Tables<'comercios'>, 'nombre' | 'tipo' | 'propietario_id'> | null;
};

export function toProduct(row: Tables<'productos'>): Product {
  return {
    id: row.id,
    name: row.nombre,
    unit: row.unidad,
    category: row.categoria_id as Category,
    brand: row.marca ?? undefined,
    active: row.activo,
    keywords: row.palabras_clave,
  };
}

export function toStore(row: StoreRow): Store {
  const owner = row.comercios?.propietario_id ?? undefined;
  return {
    id: row.id,
    name: row.comercios?.nombre ?? 'Comercio',
    branch: row.nombre_sucursal ?? undefined,
    address: row.direccion,
    hours: row.horario,
    phone: row.telefono ?? undefined,
    lat: row.lat,
    lng: row.lng,
    type: row.comercios?.tipo ?? 'otro',
    map: { x: row.mapa_x, y: row.mapa_y },
    merchant: owner ? row.comercios?.nombre : undefined,
    ownerId: owner,
    comercioId: row.comercio_id,
    tarjetaVecina: row.beneficio_tarjeta_vecina ?? undefined,
    active: row.activa,
  };
}

export function toPriceEntry(row: Tables<'precios_vigentes'>): PriceEntry | null {
  if (row.sucursal_id == null || row.producto_id == null || row.precio == null || row.registrado_en == null) return null;
  return {
    storeId: row.sucursal_id,
    productId: row.producto_id,
    price: row.precio,
    offer: row.es_oferta ?? false,
    offerUntil: row.oferta_hasta ?? undefined,
    updatedAt: row.registrado_en,
    source: row.fuente ?? 'fiscalizador',
  };
}

const SOURCE_LABEL: Record<PriceLogEntry['source'], string> = {
  fiscalizador: 'Fiscalizador municipal',
  ocr: 'Fiscalizador (captura OCR)',
  comerciante: 'Comerciante',
  carga: 'Comerciante (carga masiva)',
};

export function toPriceLog(row: Tables<'precios'>): PriceLogEntry {
  return {
    id: String(row.id),
    storeId: row.sucursal_id,
    productId: row.producto_id,
    price: row.precio,
    offer: row.es_oferta,
    date: row.registrado_en,
    source: row.fuente,
    user: SOURCE_LABEL[row.fuente],
  };
}

export function toCapture(row: Tables<'capturas'> & { precios: { producto_id: string }[] | null }): Capture {
  return {
    id: String(row.id),
    storeId: row.sucursal_id,
    date: row.creado_en,
    productIds: [...new Set((row.precios ?? []).map((p) => p.producto_id))],
    mode: row.modo,
  };
}

export function toPending(row: Tables<'solicitudes_comerciante'>): PendingMerchant {
  return {
    id: String(row.id),
    comercio: row.comercio,
    rutEmpresa: row.rut_empresa,
    tipo: row.tipo,
    telefono: row.telefono,
    nombre: row.nombre,
    email: row.email,
    rut: row.rut,
    date: row.creado_en,
  };
}

export function toUser(row: Tables<'perfiles'>): AppUser {
  return { id: row.id, name: row.nombre, email: row.email, role: row.rol, active: row.activo };
}

const AUDIT_TABLE: Record<string, AuditEntry['table']> = {
  precios: 'precios',
  productos: 'productos',
  sucursales: 'comercios',
  comercios: 'comercios',
  perfiles: 'usuarios',
  reportes: 'reportes',
  solicitudes_comerciante: 'solicitudes',
};

export function toAudit(row: Tables<'auditoria'>): AuditEntry {
  return {
    id: String(row.id),
    date: row.fecha,
    user: row.usuario_nombre,
    table: AUDIT_TABLE[row.tabla] ?? 'precios',
    operation: row.operacion as AuditEntry['operation'],
    detail: row.detalle,
  };
}

export function toReport(row: Tables<'reportes'>): CitizenReport {
  return { id: String(row.id), storeId: row.sucursal_id, reason: row.motivo, comment: row.comentario, date: row.creado_en };
}

/** Convierte una fecha "dd-mm-aaaa" (formato del formulario) a "aaaa-mm-dd" (formato de la base de datos). */
export function toIsoDate(input?: string): string | null {
  if (!input) return null;
  const m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(input.trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (date.getUTCDate() !== Number(d) || date.getUTCMonth() !== Number(mo) - 1) return null;
  return `${y}-${mo!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
}

/** Traduce los códigos de error de Postgres/PostgREST a mensajes para la persona usuaria. */
export function friendlyError(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return 'Ocurrió un error inesperado';
  const code = error.code ?? '';
  const message = error.message ?? '';
  if (code === '42501' || /row-level security/i.test(message)) return 'No tienes permiso para realizar esta operación';
  if (code === '23503') return 'El registro hace referencia a un producto o sucursal que no existe';
  if (code === '23514') return 'Los datos no cumplen las reglas de validación (revisa precios, RUT y teléfono)';
  if (code === '23505') return 'Ya existe un registro con esos datos';
  if (code === 'P0001' || code === 'P0002' || code === '22023') return message;
  if (/fetch|network|Failed to fetch/i.test(message)) return 'Sin conexión con el servidor. Inténtalo de nuevo';
  return message || 'Ocurrió un error inesperado';
}
