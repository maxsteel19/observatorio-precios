// Capa de acceso a datos: el único lugar de la app que consulta Supabase.
// Las pantallas no conocen la base de datos; usan las acciones de src/state/AppState.tsx, que llaman a estas funciones.
// Cada función recibe el cliente (`db`) para poder probarla con distintas sesiones (pruebas de integración).
import { FunctionsHttpError, type PostgrestError } from '@supabase/supabase-js';

import type { Category, Product } from '@/data/catalog';
import type { AppUser, AuditEntry, Capture, CitizenReport, PendingMerchant, PriceEntry, PriceLogEntry, PriceSource } from '@/data/seed';
import type { Store, StoreType } from '@/data/stores';
import { normalize } from '@/lib/format';
import type { Role } from '@/theme';

import { measure } from './logger';
import {
  friendlyError,
  toAudit,
  toCapture,
  toIsoDate,
  toPending,
  toPriceEntry,
  toPriceLog,
  toProduct,
  toReport,
  toStore,
  toUser,
  type StoreRow,
} from './mappers';
import type { Db } from './supabase';

export type StaffRole = Exclude<Role, 'ciudadano'>;
export type Session = { role: StaffRole; name: string; email: string; userId?: string };
export type PriceInput = { productId: string; price: number; offer: boolean; offerUntil?: string };

/** Error con un mensaje listo para mostrar y el código original de Postgres (si lo hay). */
export class RepoError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'RepoError';
  }
}

function fail(error: PostgrestError | { code?: string; message?: string }): never {
  throw new RepoError(friendlyError(error), error.code);
}

/** Máximo de filas del historial que se descargan al iniciar (las más recientes). */
const HISTORY_LIMIT = 1000;

// ---------- Lecturas públicas (ciudadano sin cuenta) ----------

export type PublicData = { catalog: Product[]; stores: Store[]; prices: PriceEntry[]; priceLog: PriceLogEntry[] };

export function loadPublicData(db: Db): Promise<PublicData> {
  return measure('cargar_datos_publicos', async () => {
    const [productos, sucursales, vigentes, historial] = await Promise.all([
      db.from('productos').select('*').order('nombre'),
      db.from('sucursales').select('*, comercios(nombre, tipo, propietario_id)').order('id'),
      db.from('precios_vigentes').select('*'),
      db.from('precios').select('*').order('registrado_en', { ascending: false }).limit(HISTORY_LIMIT),
    ]);
    for (const r of [productos, sucursales, vigentes, historial]) if (r.error) fail(r.error);
    return {
      catalog: (productos.data ?? []).map(toProduct),
      stores: ((sucursales.data ?? []) as StoreRow[]).map(toStore),
      prices: (vigentes.data ?? []).map(toPriceEntry).filter((p): p is PriceEntry => p !== null),
      priceLog: (historial.data ?? []).map(toPriceLog).reverse(),
    };
  });
}

/** Historial completo de un producto en una sucursal (usa el índice precios_producto_sucursal_fecha_idx). */
export function loadPriceHistory(db: Db, storeId: number, productId: string): Promise<PriceLogEntry[]> {
  return measure('historial_precio', async () => {
    const { data, error } = await db
      .from('precios')
      .select('*')
      .eq('producto_id', productId)
      .eq('sucursal_id', storeId)
      .order('registrado_en', { ascending: true });
    if (error) fail(error);
    return (data ?? []).map(toPriceLog);
  });
}

// ---------- Autenticación ----------

export async function signIn(db: Db, email: string, password: string): Promise<Session> {
  return measure(
    'iniciar_sesion',
    async () => {
      const { data, error } = await db.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error || !data.user) throw new RepoError('El correo o la contraseña no coinciden', error?.code);
      return sessionForUser(db, data.user.id);
    },
    { track: true },
  );
}

/** Lee el perfil de la cuenta y comprueba que esté activa. Cierra la sesión si no puede usar la app. */
export async function sessionForUser(db: Db, userId: string): Promise<Session> {
  const { data: perfil, error } = await db.from('perfiles').select('*').eq('id', userId).maybeSingle();
  if (error) fail(error);
  if (!perfil) {
    await db.auth.signOut();
    throw new RepoError('Esta cuenta no tiene un perfil asignado. Contacta a la municipalidad');
  }
  if (!perfil.activo) {
    const { data: solicitud } = await db.from('solicitudes_comerciante').select('estado').eq('usuario_id', userId).maybeSingle();
    await db.auth.signOut();
    throw new RepoError(
      solicitud?.estado === 'pendiente'
        ? 'Tu cuenta está pendiente de aprobación por la municipalidad'
        : 'Tu cuenta está desactivada. Contacta a la municipalidad',
      'cuenta_inactiva',
    );
  }
  return { role: perfil.rol, name: perfil.nombre, email: perfil.email, userId: perfil.id };
}

export async function signOut(db: Db) {
  await db.auth.signOut();
}

// ---------- Datos del personal municipal (según el rol; RLS filtra el resto) ----------

export type StaffData = {
  captures: Capture[];
  pending: PendingMerchant[];
  users: AppUser[];
  audit: AuditEntry[];
  reports: CitizenReport[];
};

export function loadStaffData(db: Db, session: Session): Promise<StaffData> {
  return measure('cargar_datos_personal', async () => {
    const empty: StaffData = { captures: [], pending: [], users: [], audit: [], reports: [] };
    if (session.role === 'comerciante') return empty;

    const capturas = await db
      .from('capturas')
      .select('*, precios(producto_id)')
      .order('creado_en', { ascending: false })
      .limit(100);
    if (capturas.error) fail(capturas.error);
    const captures = (capturas.data ?? []).map(toCapture);
    if (session.role !== 'admin') return { ...empty, captures };

    const [solicitudes, perfiles, auditoria, reportes] = await Promise.all([
      db.from('solicitudes_comerciante').select('*').eq('estado', 'pendiente').order('creado_en', { ascending: false }),
      db.from('perfiles').select('*').order('creado_en', { ascending: false }),
      db.from('auditoria').select('*').order('fecha', { ascending: false }).limit(200),
      db.from('reportes').select('*').order('creado_en', { ascending: false }).limit(100),
    ]);
    for (const r of [solicitudes, perfiles, auditoria, reportes]) if (r.error) fail(r.error);
    return {
      captures,
      pending: (solicitudes.data ?? []).map(toPending),
      users: (perfiles.data ?? []).map(toUser),
      audit: (auditoria.data ?? []).map(toAudit),
      reports: (reportes.data ?? []).map(toReport),
    };
  });
}

// ---------- Precios ----------

export function savePrices(db: Db, storeId: number, items: PriceInput[], source: PriceSource): Promise<void> {
  return measure(
    `registrar_precios_${source}`,
    async () => {
      const rows = items.map((i) => ({
        producto_id: i.productId,
        sucursal_id: storeId,
        precio: i.price,
        es_oferta: i.offer,
        oferta_hasta: i.offer ? toIsoDate(i.offerUntil) : null,
        fuente: source,
      }));
      const { error } = await db.from('precios').insert(rows);
      if (error) fail(error);
    },
    { track: true },
  );
}

/** Registra la captura del fiscalizador y sus precios en una sola transacción (RPC registrar_captura). */
export function saveCapture(db: Db, storeId: number, items: PriceInput[], mode: 'ocr' | 'manual'): Promise<number> {
  return measure(
    `registrar_captura_${mode}`,
    async () => {
      const { data, error } = await db.rpc('registrar_captura', {
        p_sucursal_id: storeId,
        p_modo: mode,
        p_items: items.map((i) => ({ producto_id: i.productId, precio: i.price })),
      });
      if (error) fail(error);
      return data as number;
    },
    { track: true },
  );
}

export function addReport(db: Db, storeId: number, reason: string, comment: string): Promise<void> {
  return measure(
    'reporte_ciudadano',
    async () => {
      const { error } = await db.from('reportes').insert({ sucursal_id: storeId, motivo: reason, comentario: comment });
      if (error) fail(error);
    },
    { track: true },
  );
}

// ---------- Registro y aprobación de comerciantes ----------

export type MerchantRegistration = {
  comercio: string;
  rutEmpresa: string;
  tipo: StoreType;
  telefono: string;
  nombre: string;
  email: string;
  rut: string;
  password: string;
};

/** Llama a la Edge Function registro-comerciante (valida en el servidor y crea la cuenta inactiva). */
export function registerMerchant(db: Db, input: MerchantRegistration): Promise<string> {
  return measure(
    'registro_comerciante',
    async () => {
      const { data, error } = await db.functions.invoke<{ id: number }>('registro-comerciante', { body: input });
      if (error) throw await functionError(error);
      return String(data?.id ?? '');
    },
    { track: true },
  );
}

async function functionError(error: unknown): Promise<RepoError> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string; campos?: Record<string, string> };
      return new RepoError(body.error ?? 'El servidor rechazó la solicitud', String(error.context.status), body.campos);
    } catch {
      return new RepoError('El servidor rechazó la solicitud', String(error.context.status));
    }
  }
  return new RepoError(friendlyError(error as { message?: string }));
}

export function approveMerchant(db: Db, id: string): Promise<void> {
  return measure(
    'aprobar_solicitud',
    async () => {
      const { error } = await db.rpc('aprobar_solicitud', { p_solicitud_id: Number(id) });
      if (error) fail(error);
    },
    { track: true },
  );
}

export function rejectMerchant(db: Db, id: string): Promise<void> {
  return measure(
    'rechazar_solicitud',
    async () => {
      const { error } = await db.rpc('rechazar_solicitud', { p_solicitud_id: Number(id) });
      if (error) fail(error);
    },
    { track: true },
  );
}

// ---------- Catálogo ----------

export function productSlug(name: string, unit: string) {
  return normalize(`${name} ${unit}`)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function addProduct(db: Db, input: { name: string; unit: string; category: Category; brand?: string }): Promise<void> {
  return measure(
    'crear_producto',
    async () => {
      const name = input.name.trim();
      const { error } = await db.from('productos').insert({
        id: productSlug(name, input.unit),
        nombre: name,
        unidad: input.unit,
        categoria_id: input.category,
        marca: input.brand?.trim() || null,
        palabras_clave: normalize(name).split(/\s+/),
      });
      if (error) fail(error.code === '23505' ? { ...error, message: 'Ya existe un producto con este nombre' } : error);
    },
    { track: true },
  );
}

export function setProductActive(db: Db, id: string, active: boolean): Promise<void> {
  return measure(
    'actualizar_producto',
    async () => {
      const { error } = await db.from('productos').update({ activo: active }).eq('id', id);
      if (error) fail(error);
    },
    { track: true },
  );
}

// ---------- Sucursales ----------

export type StoreInput = Omit<Store, 'id'> & { id?: number };

export function saveStore(db: Db, input: StoreInput, session: Session | null): Promise<void> {
  return measure(
    input.id != null ? 'actualizar_sucursal' : 'crear_sucursal',
    async () => {
      const fields = {
        nombre_sucursal: input.branch?.trim() || null,
        direccion: input.address.trim(),
        horario: input.hours.trim(),
        telefono: input.phone?.trim() || null,
        lat: input.lat,
        lng: input.lng,
        mapa_x: Math.round(input.map.x),
        mapa_y: Math.round(input.map.y),
        activa: input.active,
      };
      if (input.id != null) {
        // .select() devuelve las filas actualizadas: si RLS bloquea la sucursal, vuelve vacío.
        const { data, error } = await db.from('sucursales').update(fields).eq('id', input.id).select('id');
        if (error) fail(error);
        if (!data?.length) throw new RepoError('No tienes permiso para modificar esta sucursal', '42501');
        return;
      }
      let comercioId = input.comercioId;
      if (comercioId == null && session?.userId) {
        const { data } = await db.from('comercios').select('id').eq('propietario_id', session.userId).limit(1).maybeSingle();
        comercioId = data?.id;
      }
      if (comercioId == null) throw new RepoError('Tu cuenta no tiene un comercio asociado');
      const { error } = await db.from('sucursales').insert({ ...fields, comercio_id: comercioId });
      if (error) fail(error);
    },
    { track: true },
  );
}

export function setStoreActive(db: Db, id: number, active: boolean): Promise<void> {
  return measure(
    'actualizar_sucursal',
    async () => {
      const { data, error } = await db.from('sucursales').update({ activa: active }).eq('id', id).select('id');
      if (error) fail(error);
      if (!data?.length) throw new RepoError('No tienes permiso para modificar esta sucursal', '42501');
    },
    { track: true },
  );
}

// ---------- Monitoreo (administrador) ----------

export type AppEvent = {
  id: number;
  date: string;
  level: 'info' | 'warn' | 'error';
  operation: string;
  durationMs: number | null;
  message: string | null;
  platform: string | null;
  version: string | null;
};

export function loadAppEvents(db: Db, limit = 100): Promise<AppEvent[]> {
  return measure('cargar_eventos', async () => {
    const { data, error } = await db.from('eventos_app').select('*').order('fecha', { ascending: false }).limit(limit);
    if (error) fail(error);
    return (data ?? []).map((e) => ({
      id: e.id,
      date: e.fecha,
      level: e.nivel as AppEvent['level'],
      operation: e.operacion,
      durationMs: e.duracion_ms,
      message: e.mensaje,
      platform: e.plataforma,
      version: e.version_app,
    }));
  });
}

// ---------- Usuarios (administrador) ----------

/** Crea la cuenta con la Edge Function admin-usuarios y devuelve la contraseña temporal. */
export function createUser(db: Db, input: { name: string; email: string; role: Role }): Promise<string> {
  return measure(
    'crear_usuario',
    async () => {
      const { data, error } = await db.functions.invoke<{ passwordTemporal: string }>('admin-usuarios', {
        body: { nombre: input.name, email: input.email, rol: input.role },
      });
      if (error) throw await functionError(error);
      return data?.passwordTemporal ?? '';
    },
    { track: true },
  );
}

export function setUserActive(db: Db, id: string, active: boolean): Promise<void> {
  return measure(
    'actualizar_usuario',
    async () => {
      const { error } = await db.from('perfiles').update({ activo: active }).eq('id', id);
      if (error) fail(error);
    },
    { track: true },
  );
}
