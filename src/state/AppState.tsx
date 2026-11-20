// Estado global de la demo. Todo está en memoria para que la app funcione sin internet en la feria.
// Más adelante este archivo es el único lugar que hay que cambiar para conectar un backend (Supabase).
import { createContext, useContext, useState, type ReactNode } from 'react';

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
import type { Role } from '@/theme';

export type StaffRole = Exclude<Role, 'ciudadano'>;

export type Session = { role: StaffRole; name: string; email: string };

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
};

export type PriceInput = { productId: string; price: number; offer: boolean; offerUntil?: string };

type Actions = {
  login: (email: string, password: string) => Session | null;
  loginAs: (role: StaffRole) => Session;
  logout: () => void;
  savePrices: (storeId: number, items: PriceInput[], source: PriceSource) => void;
  addCapture: (storeId: number, productIds: string[], mode: Capture['mode']) => void;
  addReport: (storeId: number, reason: string, comment: string) => void;
  /** Registra la solicitud y devuelve su id. */
  registerMerchant: (data: Omit<PendingMerchant, 'id' | 'date'>) => string;
  approveMerchant: (id: string) => void;
  rejectMerchant: (id: string) => void;
  addProduct: (data: { name: string; unit: string; category: Category; brand?: string }) => string | null;
  toggleProduct: (id: string) => void;
  saveStore: (store: Omit<Store, 'id'> & { id?: number }) => void;
  toggleStore: (id: number) => void;
  addUser: (data: { name: string; email: string; role: Role }) => string | null;
  toggleUser: (id: string) => void;
};

type AppContextValue = Data & Actions;

const AppContext = createContext<AppContextValue | null>(null);

const INITIAL_DATA: Data = {
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
};

function audit(
  data: Data,
  table: AuditEntry['table'],
  operation: AuditEntry['operation'],
  detail: string,
): AuditEntry[] {
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

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(INITIAL_DATA);

  const sessionFor = (role: StaffRole): Session => {
    const account = DEMO_ACCOUNTS.find((a) => a.role === role)!;
    return { role, name: account.name, email: account.email };
  };

  const actions: Actions = {
    login(email, password) {
      const account = DEMO_ACCOUNTS.find(
        (a) => a.email === email.trim().toLowerCase() && a.password === password,
      );
      if (!account) return null;
      const session = sessionFor(account.role);
      setData((d) => ({ ...d, session }));
      return session;
    },

    loginAs(role) {
      const session = sessionFor(role);
      setData((d) => ({ ...d, session }));
      return session;
    },

    logout() {
      setData((d) => ({ ...d, session: null }));
    },

    savePrices(storeId, items, source) {
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
          log.push({
            id: newId('h'),
            storeId,
            productId: item.productId,
            price: item.price,
            offer: item.offer,
            date: now,
            source,
            user,
          });
        }
        const store = d.stores.find((s) => s.id === storeId);
        const sourceText: Record<PriceSource, string> = {
          ocr: 'Captura OCR',
          fiscalizador: 'Ingreso manual (fiscalizador)',
          comerciante: 'Ingreso manual',
          carga: 'Carga masiva',
        };
        return {
          ...d,
          prices,
          priceLog: [...d.priceLog, ...log],
          audit: audit(
            d,
            'precios',
            'INSERT',
            `${sourceText[source]} en ${store ? storeLabel(store) : 'comercio'} · ${items.length} precio${items.length === 1 ? '' : 's'}`,
          ),
        };
      });
    },

    addCapture(storeId, productIds, mode) {
      setData((d) => ({
        ...d,
        captures: [{ id: newId('c'), storeId, productIds, mode, date: new Date().toISOString() }, ...d.captures],
      }));
    },

    addReport(storeId, reason, comment) {
      setData((d) => {
        const store = d.stores.find((s) => s.id === storeId);
        return {
          ...d,
          reports: [{ id: newId('r'), storeId, reason, comment, date: new Date().toISOString() }, ...d.reports],
          audit: audit(d, 'reportes', 'INSERT', `Reporte ciudadano en ${store ? storeLabel(store) : 'comercio'}: ${reason}`),
        };
      });
    },

    registerMerchant(input) {
      const id = newId('p');
      setData((d) => ({
        ...d,
        pending: [{ ...input, id, date: new Date().toISOString() }, ...d.pending],
        audit: audit({ ...d, session: null }, 'solicitudes', 'INSERT', `Solicitud de registro: ${input.comercio}`),
      }));
      return id;
    },

    approveMerchant(id) {
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
    },

    rejectMerchant(id) {
      setData((d) => {
        const req = d.pending.find((p) => p.id === id);
        if (!req) return d;
        return {
          ...d,
          pending: d.pending.filter((p) => p.id !== id),
          audit: audit(d, 'solicitudes', 'DELETE', `Solicitud rechazada: ${req.comercio}`),
        };
      });
    },

    addProduct(input) {
      const name = input.name.trim();
      if (!name) return 'Ingresa un nombre';
      if (data.catalog.some((p) => normalize(p.name) === normalize(name) && p.unit === input.unit)) {
        return 'Ya existe un producto con este nombre';
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

    toggleProduct(id) {
      setData((d) => {
        const product = d.catalog.find((p) => p.id === id);
        if (!product) return d;
        return {
          ...d,
          catalog: d.catalog.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
          audit: audit(d, 'productos', 'UPDATE', `${product.active ? 'Desactivado' : 'Activado'}: ${product.name}`),
        };
      });
    },

    saveStore(input) {
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
    },

    toggleStore(id) {
      setData((d) => {
        const store = d.stores.find((s) => s.id === id);
        if (!store) return d;
        return {
          ...d,
          stores: d.stores.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
          audit: audit(d, 'comercios', 'UPDATE', `${store.active ? 'Desactivado' : 'Activado'}: ${storeLabel(store)}`),
        };
      });
    },

    addUser(input) {
      const email = input.email.trim().toLowerCase();
      if (!input.name.trim()) return 'Ingresa un nombre';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email no válido';
      if (data.users.some((u) => u.email === email)) return 'Ya existe un usuario con ese email';
      setData((d) => ({
        ...d,
        users: [{ id: newId('u'), name: input.name.trim(), email, role: input.role, active: true }, ...d.users],
        audit: audit(d, 'usuarios', 'INSERT', `Nuevo usuario: ${input.name.trim()} (${input.role})`),
      }));
      return null;
    },

    toggleUser(id) {
      setData((d) => {
        const user = d.users.find((u) => u.id === id);
        if (!user) return d;
        return {
          ...d,
          users: d.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)),
          audit: audit(d, 'usuarios', 'UPDATE', `Cuenta ${user.active ? 'desactivada' : 'activada'}: ${user.name}`),
        };
      });
    },
  };

  return <AppContext.Provider value={{ ...data, ...actions }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppStateProvider>');
  return ctx;
}

/** Comercios (sucursales) que pertenecen a la cuenta de comerciante con sesión iniciada. */
export function useMerchantStores() {
  const { stores, session } = useApp();
  return stores.filter((s) => s.merchant && s.merchant === session?.name);
}
