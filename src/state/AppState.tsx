// Estado global de la app (capa de lógica entre las pantallas y los datos).
//
// Dos modos:
// - "supabase": hay backend configurado (.env.local). Las acciones llaman a src/services/repository.ts,
//   que escribe en la base de datos; luego se recargan los datos para reflejar lo guardado.
// - "demo": sin backend o sin conexión. Todo vive en memoria, como en la feria (funciona sin internet).
//
// Las pantallas solo usan useApp(): no saben en qué modo están ni cómo se guardan los datos.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { INITIAL_CATALOG, type Category, type Product } from '@/data/catalog';
import {
  DEMO_ACCOUNTS,
  INITIAL_AUDIT,
  INITIAL_CAPTURES,
  INITIAL_PENDING,
  INITIAL_PRICE_LOG,
  INITIAL_PRICES,
  INITIAL_USERS,
  newId,
  type AppUser,
  type AuditEntry,
  type Capture,
  type CitizenReport,
  type PendingMerchant,
  type PriceEntry,
  type PriceLogEntry,
  type PriceSource,
} from '@/data/seed';
import { INITIAL_STORES, storeLabel, type Store } from '@/data/stores';
import { normalize } from '@/lib/format';
import { errorMessage, logEvent } from '@/services/logger';
import * as repo from '@/services/repository';
import { RepoError, type MerchantRegistration, type PriceInput, type Session, type StaffRole, type StoreInput } from '@/services/repository';
import { supabase } from '@/services/supabase';
import type { Role } from '@/theme';

export type { PriceInput, Session, StaffRole };

export type BackendMode = 'supabase' | 'demo';

type Data = {
  session: Session | null;
  catalog: Product[];
  stores: Store[];
  prices: PriceEntry[];
  priceLog: PriceLogEntry[];
  captures: Capture[];
  pending: PendingMerchant[];
  users: AppUser[];
  audit: AuditEntry[];
  reports: CitizenReport[];
  /** Última solicitud enviada desde este dispositivo (para la pantalla "Cuenta en revisión"). */
  lastRegistration: { id: string; comercio: string; email: string } | null;
};

type Status = {
  mode: BackendMode;
  /** true mientras se cargan los datos iniciales desde Supabase. */
  loading: boolean;
  /** true si había backend configurado pero no se pudo conectar (la app usa los datos de demo). */
  offline: boolean;
};

/** Mensaje de error para mostrar, o null si la operación salió bien. */
type Outcome = Promise<string | null>;

type Actions = {
  login: (email: string, password: string) => Promise<{ session?: Session; error?: string }>;
  loginAs: (role: StaffRole) => Promise<{ session?: Session; error?: string }>;
  logout: () => Promise<void>;
  savePrices: (storeId: number, items: PriceInput[], source: PriceSource) => Outcome;
  saveCapture: (storeId: number, items: PriceInput[], mode: Capture['mode']) => Outcome;
  addReport: (storeId: number, reason: string, comment: string) => Outcome;
  registerMerchant: (data: MerchantRegistration) => Promise<{ id?: string; error?: string; fields?: Record<string, string> }>;
  approveMerchant: (id: string) => Outcome;
  rejectMerchant: (id: string) => Outcome;
  addProduct: (data: { name: string; unit: string; category: Category; brand?: string }) => Outcome;
  toggleProduct: (id: string) => Outcome;
  saveStore: (store: StoreInput) => Outcome;
  toggleStore: (id: number) => Outcome;
  addUser: (data: { name: string; email: string; role: Role }) => Promise<{ error?: string; tempPassword?: string }>;
  toggleUser: (id: string) => Outcome;
  refresh: () => Promise<void>;
};

type AppContextValue = Data & Status & Actions;

const AppContext = createContext<AppContextValue | null>(null);

const DEMO_DATA: Data = {
  session: null,
  catalog: INITIAL_CATALOG,
  stores: INITIAL_STORES,
  prices: INITIAL_PRICES,
  priceLog: INITIAL_PRICE_LOG,
  captures: INITIAL_CAPTURES,
  pending: INITIAL_PENDING,
  users: INITIAL_USERS,
  audit: INITIAL_AUDIT,
  reports: [],
  lastRegistration: null,
};

const EMPTY_STAFF = { captures: [], pending: [], users: [], audit: [], reports: [] };

/** Estado inicial con backend: vacío hasta que llegan los datos reales (evita mostrar datos de demo). */
const EMPTY_DATA: Data = { ...DEMO_DATA, ...EMPTY_STAFF, catalog: [], stores: [], prices: [], priceLog: [] };

function audit(data: Data, table: AuditEntry['table'], operation: AuditEntry['operation'], detail: string): AuditEntry[] {
  const entry: AuditEntry = {
    id: newId('a'),
    date: new Date().toISOString(),
    user: data.session?.name ?? 'Ciudadano (anónimo)',
    table,
    operation,
    detail,
  };
  return [entry, ...data.audit];
}

const SOURCE_TEXT: Record<PriceSource, string> = {
  ocr: 'Captura OCR',
  fiscalizador: 'Ingreso manual (fiscalizador)',
  comerciante: 'Ingreso manual',
  carga: 'Carga masiva',
};

/** Ejecuta una escritura y devuelve el mensaje de error para la interfaz (o null si salió bien). */
async function attempt(fn: () => Promise<unknown>): Outcome {
  try {
    await fn();
    return null;
  } catch (e) {
    return e instanceof RepoError ? e.message : errorMessage(e);
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(supabase ? EMPTY_DATA : DEMO_DATA);
  const [status, setStatus] = useState<Status>({
    mode: supabase ? 'supabase' : 'demo',
    loading: supabase != null,
    offline: false,
  });
  // Cliente activo: null en modo demo (sin backend o sin conexión).
  const db = status.mode === 'supabase' ? supabase : null;

  const reloadPublic = useCallback(async () => {
    if (!supabase) return;
    const pub = await repo.loadPublicData(supabase);
    setData((d) => ({ ...d, ...pub }));
  }, []);

  const reloadStaff = useCallback(async (session: Session | null) => {
    if (!supabase || !session) return;
    const staff = await repo.loadStaffData(supabase, session);
    setData((d) => ({ ...d, ...staff }));
  }, []);

  // Carga inicial: datos públicos + sesión guardada en el dispositivo.
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;
    (async () => {
      try {
        const pub = await repo.loadPublicData(client);
        if (cancelled) return;
        setData((d) => ({ ...d, ...pub }));
        const { data: auth } = await client.auth.getSession();
        if (auth.session?.user) {
          try {
            const session = await repo.sessionForUser(client, auth.session.user.id);
            if (cancelled) return;
            setData((d) => ({ ...d, session }));
            const staff = await repo.loadStaffData(client, session);
            if (!cancelled) setData((d) => ({ ...d, ...staff }));
          } catch {
            // Sesión vencida o cuenta desactivada: se queda como ciudadano.
          }
        }
        if (!cancelled) setStatus({ mode: 'supabase', loading: false, offline: false });
      } catch (e) {
        // Sin conexión: la app sigue funcionando con los datos de demo.
        logEvent({ level: 'error', operation: 'conexion_inicial', message: errorMessage(e) });
        if (cancelled) return;
        setData((d) => ({ ...DEMO_DATA, lastRegistration: d.lastRegistration }));
        setStatus({ mode: 'demo', loading: false, offline: true });
      }
    })();
    const { data: listener } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setData((d) => ({ ...d, session: null, ...EMPTY_STAFF }));
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const demoSession = (role: StaffRole): Session => {
    const account = DEMO_ACCOUNTS.find((a) => a.role === role)!;
    return { role, name: account.name, email: account.email };
  };

  const startSession = async (session: Session) => {
    setData((d) => ({ ...d, session }));
    try {
      await reloadStaff(session);
      await reloadPublic(); // el administrador también ve productos y sucursales inactivos
    } catch (e) {
      logEvent({ level: 'error', operation: 'cargar_datos_personal', message: errorMessage(e) });
    }
  };

  const actions: Actions = {
    async login(email, password) {
      if (db) {
        try {
          const session = await repo.signIn(db, email, password);
          await startSession(session);
          return { session };
        } catch (e) {
          return { error: e instanceof RepoError ? e.message : 'No se pudo iniciar sesión' };
        }
      }
      const account = DEMO_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase() && a.password === password);
      if (!account) return { error: 'El correo o la contraseña no coinciden' };
      const session = demoSession(account.role);
      setData((d) => ({ ...d, session }));
      return { session };
    },

    async loginAs(role) {
      const account = DEMO_ACCOUNTS.find((a) => a.role === role)!;
      return actions.login(account.email, account.password);
    },

    async logout() {
      if (db) await repo.signOut(db);
      setData((d) => ({ ...d, session: null, ...(db ? EMPTY_STAFF : {}) }));
      if (db) void reloadPublic().catch(() => undefined);
    },

    async savePrices(storeId, items, source) {
      if (db) {
        return attempt(async () => {
          await repo.savePrices(db, storeId, items, source);
          await reloadPublic();
        });
      }
      setData((d) => {
        const now = new Date().toISOString();
        const user = d.session?.name ?? 'Sistema';
        let prices = [...d.prices];
        const log: PriceLogEntry[] = [];
        for (const item of items) {
          const entry: PriceEntry = {
            storeId,
            productId: item.productId,
            price: item.price,
            offer: item.offer,
            offerUntil: item.offerUntil,
            updatedAt: now,
            source,
          };
          const idx = prices.findIndex((p) => p.storeId === storeId && p.productId === item.productId);
          if (idx >= 0) prices[idx] = entry;
          else prices = [...prices, entry];
          log.push({ id: newId('h'), storeId, productId: item.productId, price: item.price, offer: item.offer, date: now, source, user });
        }
        const store = d.stores.find((s) => s.id === storeId);
        return {
          ...d,
          prices,
          priceLog: [...d.priceLog, ...log],
          audit: audit(
            d,
            'precios',
            'INSERT',
            `${SOURCE_TEXT[source]} en ${store ? storeLabel(store) : 'comercio'} · ${items.length} precio${items.length === 1 ? '' : 's'}`,
          ),
        };
      });
      return null;
    },

    async saveCapture(storeId, items, mode) {
      if (db) {
        return attempt(async () => {
          await repo.saveCapture(db, storeId, items, mode);
          await Promise.all([reloadPublic(), reloadStaff(data.session)]);
        });
      }
      await actions.savePrices(storeId, items, mode === 'ocr' ? 'ocr' : 'fiscalizador');
      setData((d) => ({
        ...d,
        captures: [
          { id: newId('c'), storeId, productIds: items.map((i) => i.productId), mode, date: new Date().toISOString() },
          ...d.captures,
        ],
      }));
      return null;
    },

    async addReport(storeId, reason, comment) {
      if (db) return attempt(() => repo.addReport(db, storeId, reason, comment));
      setData((d) => {
        const store = d.stores.find((s) => s.id === storeId);
        return {
          ...d,
          reports: [{ id: newId('r'), storeId, reason, comment, date: new Date().toISOString() }, ...d.reports],
          audit: audit(d, 'reportes', 'INSERT', `Reporte ciudadano en ${store ? storeLabel(store) : 'comercio'}: ${reason}`),
        };
      });
      return null;
    },

    async registerMerchant(input) {
      if (db) {
        try {
          const id = await repo.registerMerchant(db, input);
          setData((d) => ({ ...d, lastRegistration: { id, comercio: input.comercio, email: input.email } }));
          return { id };
        } catch (e) {
          if (e instanceof RepoError) return { error: e.message, fields: e.fields };
          return { error: errorMessage(e) };
        }
      }
      const id = newId('p');
      // La contraseña no se guarda en memoria: en modo demo no hay cuentas nuevas.
      const request: Omit<PendingMerchant, 'id' | 'date'> = {
        comercio: input.comercio,
        rutEmpresa: input.rutEmpresa,
        tipo: input.tipo,
        telefono: input.telefono,
        nombre: input.nombre,
        email: input.email,
        rut: input.rut,
      };
      setData((d) => ({
        ...d,
        pending: [{ ...request, id, date: new Date().toISOString() }, ...d.pending],
        lastRegistration: { id, comercio: input.comercio, email: input.email },
        audit: audit({ ...d, session: null }, 'solicitudes', 'INSERT', `Solicitud de registro: ${input.comercio}`),
      }));
      return { id };
    },

    async approveMerchant(id) {
      if (db) {
        return attempt(async () => {
          await repo.approveMerchant(db, id);
          await reloadStaff(data.session);
        });
      }
      setData((d) => {
        const req = d.pending.find((p) => p.id === id);
        if (!req) return d;
        const user: AppUser = { id: newId('u'), name: req.comercio, email: req.email, role: 'comerciante', active: true };
        return {
          ...d,
          pending: d.pending.filter((p) => p.id !== id),
          users: [user, ...d.users],
          audit: audit(d, 'solicitudes', 'UPDATE', `Cuenta aprobada: ${req.comercio}`),
        };
      });
      return null;
    },

    async rejectMerchant(id) {
      if (db) {
        return attempt(async () => {
          await repo.rejectMerchant(db, id);
          await reloadStaff(data.session);
        });
      }
      setData((d) => {
        const req = d.pending.find((p) => p.id === id);
        if (!req) return d;
        return {
          ...d,
          pending: d.pending.filter((p) => p.id !== id),
          audit: audit(d, 'solicitudes', 'DELETE', `Solicitud rechazada: ${req.comercio}`),
        };
      });
      return null;
    },

    async addProduct(input) {
      const name = input.name.trim();
      if (!name) return 'Ingresa un nombre';
      if (data.catalog.some((p) => normalize(p.name) === normalize(name) && p.unit === input.unit)) {
        return 'Ya existe un producto con este nombre';
      }
      if (db) {
        return attempt(async () => {
          await repo.addProduct(db, input);
          await Promise.all([reloadPublic(), reloadStaff(data.session)]);
        });
      }
      const product: Product = {
        id: newId('prod'),
        name,
        unit: input.unit,
        category: input.category,
        brand: input.brand?.trim() || undefined,
        active: true,
        keywords: normalize(name).split(/\s+/),
      };
      setData((d) => ({
        ...d,
        catalog: [...d.catalog, product],
        audit: audit(d, 'productos', 'INSERT', `Nuevo producto: ${name} · ${input.unit}`),
      }));
      return null;
    },

    async toggleProduct(id) {
      const product = data.catalog.find((p) => p.id === id);
      if (!product) return 'Producto no encontrado';
      if (db) {
        return attempt(async () => {
          await repo.setProductActive(db, id, !product.active);
          await Promise.all([reloadPublic(), reloadStaff(data.session)]);
        });
      }
      setData((d) => ({
        ...d,
        catalog: d.catalog.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
        audit: audit(d, 'productos', 'UPDATE', `${product.active ? 'Desactivado' : 'Activado'}: ${product.name}`),
      }));
      return null;
    },

    async saveStore(input) {
      if (db) {
        return attempt(async () => {
          await repo.saveStore(db, input, data.session);
          await Promise.all([reloadPublic(), reloadStaff(data.session)]);
        });
      }
      setData((d) => {
        if (input.id != null) {
          const id = input.id;
          return {
            ...d,
            stores: d.stores.map((s) => (s.id === id ? { ...s, ...input, id } : s)),
            audit: audit(d, 'comercios', 'UPDATE', `Sucursal actualizada: ${storeLabel(input)}`),
          };
        }
        const id = Math.max(0, ...d.stores.map((s) => s.id)) + 1;
        return {
          ...d,
          stores: [...d.stores, { ...input, id }],
          audit: audit(d, 'comercios', 'INSERT', `Nueva sucursal: ${storeLabel(input)}`),
        };
      });
      return null;
    },

    async toggleStore(id) {
      const store = data.stores.find((s) => s.id === id);
      if (!store) return 'Sucursal no encontrada';
      if (db) {
        return attempt(async () => {
          await repo.setStoreActive(db, id, !store.active);
          await Promise.all([reloadPublic(), reloadStaff(data.session)]);
        });
      }
      setData((d) => ({
        ...d,
        stores: d.stores.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
        audit: audit(d, 'comercios', 'UPDATE', `${store.active ? 'Desactivado' : 'Activado'}: ${storeLabel(store)}`),
      }));
      return null;
    },

    async addUser(input) {
      const email = input.email.trim().toLowerCase();
      if (!input.name.trim()) return { error: 'Ingresa un nombre' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Email no válido' };
      if (data.users.some((u) => u.email === email)) return { error: 'Ya existe un usuario con ese email' };
      if (db) {
        try {
          const tempPassword = await repo.createUser(db, { ...input, name: input.name.trim(), email });
          await reloadStaff(data.session);
          return { tempPassword };
        } catch (e) {
          return { error: e instanceof RepoError ? e.message : errorMessage(e) };
        }
      }
      setData((d) => ({
        ...d,
        users: [{ id: newId('u'), name: input.name.trim(), email, role: input.role, active: true }, ...d.users],
        audit: audit(d, 'usuarios', 'INSERT', `Nuevo usuario: ${input.name.trim()} (${input.role})`),
      }));
      return {};
    },

    async toggleUser(id) {
      const user = data.users.find((u) => u.id === id);
      if (!user) return 'Usuario no encontrado';
      if (db) {
        return attempt(async () => {
          await repo.setUserActive(db, id, !user.active);
          await reloadStaff(data.session);
        });
      }
      setData((d) => ({
        ...d,
        users: d.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)),
        audit: audit(d, 'usuarios', 'UPDATE', `Cuenta ${user.active ? 'desactivada' : 'activada'}: ${user.name}`),
      }));
      return null;
    },

    async refresh() {
      if (!db) return;
      try {
        await Promise.all([reloadPublic(), reloadStaff(data.session)]);
      } catch (e) {
        logEvent({ level: 'error', operation: 'refrescar', message: errorMessage(e) });
      }
    },
  };

  return <AppContext.Provider value={{ ...data, ...status, ...actions }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppStateProvider>');
  return ctx;
}

/** Comercios (sucursales) que pertenecen a la cuenta de comerciante con sesión iniciada. */
export function useMerchantStores() {
  const { stores, session } = useApp();
  return stores.filter((s) =>
    s.ownerId && session?.userId ? s.ownerId === session.userId : s.merchant != null && s.merchant === session?.name,
  );
}
