// Datos de ejemplo para la demo. Todo vive en memoria: al recargar la app vuelve a este estado.
import type { Role } from '@/theme';
import type { StoreType } from './stores';

export type PriceSource = 'fiscalizador' | 'ocr' | 'comerciante' | 'carga';

export type PriceEntry = {
  storeId: number;
  productId: string;
  price: number;
  offer: boolean;
  offerUntil?: string;
  updatedAt: string;
  source: PriceSource;
};

export type PriceLogEntry = {
  id: string;
  storeId: number;
  productId: string;
  price: number;
  offer: boolean;
  date: string;
  source: PriceSource;
  user: string;
};

export type Capture = {
  id: string;
  storeId: number;
  date: string;
  productIds: string[];
  mode: 'ocr' | 'manual';
};

export type PendingMerchant = {
  id: string;
  comercio: string;
  rutEmpresa: string;
  tipo: StoreType;
  telefono: string;
  nombre: string;
  email: string;
  rut: string;
  date: string;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export type AuditEntry = {
  id: string;
  date: string;
  user: string;
  table: 'precios' | 'productos' | 'comercios' | 'usuarios' | 'reportes' | 'solicitudes';
  operation: AuditOperation;
  detail: string;
};

export type CitizenReport = {
  id: string;
  storeId: number;
  reason: string;
  comment: string;
  date: string;
};

/** Cuentas de prueba para el login de la demo (no son credenciales reales). */
export const DEMO_ACCOUNTS: { email: string; password: string; role: Exclude<Role, 'ciudadano'>; name: string }[] = [
  { email: 'admin@demo.cl', password: 'demo1234', role: 'admin', name: 'Benjamín' },
  { email: 'fiscalizador@demo.cl', password: 'demo1234', role: 'fiscalizador', name: 'Javier' },
  { email: 'comercio@demo.cl', password: 'demo1234', role: 'comerciante', name: 'Minimarket El Sol' },
];

// ---------- utilidades de fechas ----------
export function daysAgo(days: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  // Evita fechas "en el futuro" cuando la demo se abre temprano en el día.
  if (d.getTime() > Date.now()) d.setTime(Date.now() - (60 - minute) * 60000);
  return d.toISOString();
}

let idCounter = 0;
export function newId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

// ---------- precios actuales ----------
// [comercio, producto, precio, oferta, días desde la última actualización, fuente]
const RAW_PRICES: [number, string, number, boolean, number, PriceSource][] = [
  [1, 'arroz', 1290, false, 0, 'fiscalizador'],
  [1, 'aceite', 1890, false, 1, 'fiscalizador'],
  [1, 'azucar', 990, false, 0, 'fiscalizador'],
  [1, 'harina', 890, false, 2, 'fiscalizador'],
  [1, 'fideos', 790, false, 1, 'ocr'],
  [2, 'arroz', 1350, false, 0, 'ocr'],
  [2, 'leche', 1090, false, 0, 'ocr'],
  [2, 'huevos', 1890, false, 1, 'fiscalizador'],
  [2, 'pan', 1400, false, 0, 'fiscalizador'],
  [2, 'fideos', 850, false, 2, 'fiscalizador'],
  [3, 'arroz', 1190, true, 0, 'comerciante'],
  [3, 'aceite', 1750, true, 0, 'comerciante'],
  [3, 'leche', 990, true, 0, 'comerciante'],
  [3, 'azucar', 950, false, 1, 'carga'],
  [3, 'pollo', 2490, false, 0, 'carga'],
  [3, 'fideos', 690, true, 0, 'carga'],
  [3, 'huevos', 1990, false, 1, 'carga'],
  [3, 'carne', 5990, false, 1, 'carga'],
  [4, 'arroz', 1420, false, 3, 'fiscalizador'],
  [4, 'pan', 1300, true, 0, 'ocr'],
  [4, 'tomate', 890, false, 0, 'ocr'],
  [4, 'papa', 690, false, 1, 'ocr'],
  [4, 'cebolla', 790, false, 1, 'fiscalizador'],
  [5, 'arroz', 1250, false, 0, 'fiscalizador'],
  [5, 'aceite', 1950, false, 1, 'fiscalizador'],
  [5, 'leche', 1150, false, 0, 'ocr'],
  [5, 'huevos', 1750, false, 0, 'ocr'],
  [5, 'harina', 950, false, 2, 'fiscalizador'],
  [6, 'tomate', 750, true, 0, 'ocr'],
  [6, 'papa', 590, true, 0, 'ocr'],
  [6, 'cebolla', 690, false, 0, 'ocr'],
  [6, 'pollo', 2290, true, 0, 'fiscalizador'],
  [6, 'zanahoria', 590, false, 0, 'ocr'],
  [7, 'arroz', 1290, false, 0, 'comerciante'],
  [7, 'aceite', 2490, true, 1, 'comerciante'],
  [7, 'leche', 1050, false, 3, 'comerciante'],
  [7, 'pan', 1200, false, 0, 'ocr'],
  [7, 'huevos', 2490, false, 1, 'ocr'],
  [7, 'azucar', 1150, false, 1, 'ocr'],
  [8, 'arroz', 1320, false, 1, 'carga'],
  [8, 'leche', 1050, false, 3, 'carga'],
  [8, 'fideos', 820, false, 1, 'carga'],
  [8, 'pan', 1350, false, 1, 'carga'],
];

const SOURCE_USER: Record<PriceSource, string> = {
  fiscalizador: 'Javier (fiscalizador)',
  ocr: 'Javier (OCR)',
  comerciante: 'Comerciante',
  carga: 'Comerciante (carga masiva)',
};

export const INITIAL_PRICES: PriceEntry[] = RAW_PRICES.map(([storeId, productId, price, offer, days, source]) => ({
  storeId,
  productId,
  price,
  offer,
  updatedAt: daysAgo(days, 9 + (storeId % 8), (price / 10) % 60),
  source,
}));

// ---------- historial de precios (últimos ~30 días) ----------
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const round10 = (n: number) => Math.round(n / 10) * 10;

function buildHistory(): PriceLogEntry[] {
  const log: PriceLogEntry[] = [];
  for (const entry of INITIAL_PRICES) {
    const rnd = seeded(entry.storeId * 977 + hash(entry.productId));
    // drift > 0: el precio subió en el mes; drift < 0: bajó.
    const drift = (rnd() - 0.6) * 0.18;
    const lastDays = Math.round((Date.now() - new Date(entry.updatedAt).getTime()) / 86400000);
    const days = [30, 24, 18, 12, 6].filter((d) => d > lastDays + 1);
    days.forEach((d, i) => {
      const frac = i / days.length;
      const base = entry.price * (1 - drift * (1 - frac));
      const noise = (rnd() - 0.5) * 0.04 * entry.price;
      log.push({
        id: `h-${entry.storeId}-${entry.productId}-${d}`,
        storeId: entry.storeId,
        productId: entry.productId,
        price: round10(base + noise),
        offer: false,
        date: daysAgo(d, 10 + (i % 5)),
        source: entry.source,
        user: SOURCE_USER[entry.source],
      });
    });
    log.push({
      id: `h-${entry.storeId}-${entry.productId}-now`,
      storeId: entry.storeId,
      productId: entry.productId,
      price: entry.price,
      offer: entry.offer,
      date: entry.updatedAt,
      source: entry.source,
      user: SOURCE_USER[entry.source],
    });
  }
  return log;
}

export const INITIAL_PRICE_LOG: PriceLogEntry[] = buildHistory();

// ---------- capturas del fiscalizador ----------
export const INITIAL_CAPTURES: Capture[] = [
  { id: 'c1', storeId: 7, date: daysAgo(0, 9, 42), productIds: ['pan', 'huevos', 'azucar'], mode: 'ocr' },
  { id: 'c2', storeId: 4, date: daysAgo(0, 10, 15), productIds: ['pan', 'tomate', 'papa', 'cebolla'], mode: 'ocr' },
  { id: 'c3', storeId: 6, date: daysAgo(0, 11, 3), productIds: ['tomate', 'papa', 'cebolla', 'zanahoria'], mode: 'ocr' },
  { id: 'c4', storeId: 2, date: daysAgo(1, 16, 40), productIds: ['huevos', 'pan'], mode: 'manual' },
  { id: 'c5', storeId: 5, date: daysAgo(3, 11, 20), productIds: ['aceite', 'harina', 'leche'], mode: 'manual' },
  { id: 'c6', storeId: 1, date: daysAgo(7, 15, 5), productIds: ['arroz', 'fideos', 'azucar', 'harina'], mode: 'ocr' },
  { id: 'c7', storeId: 4, date: daysAgo(26, 9, 10), productIds: ['arroz'], mode: 'manual' },
  { id: 'c8', storeId: 6, date: daysAgo(44, 12, 30), productIds: ['papa', 'cebolla', 'tomate', 'zanahoria'], mode: 'ocr' },
];

/** Lo que "detecta" el OCR simulado al fotografiar una pizarra de precios. */
export const OCR_SAMPLE: { productId: string; price: number; confidence: number }[] = [
  { productId: 'pan', price: 1200, confidence: 94 },
  { productId: 'aceite', price: 1890, confidence: 71 },
  { productId: 'huevos', price: 2490, confidence: 88 },
  { productId: 'leche', price: 980, confidence: 42 },
  { productId: 'azucar', price: 1150, confidence: 65 },
];

// ---------- solicitudes de comerciantes ----------
export const INITIAL_PENDING: PendingMerchant[] = [
  {
    id: 'p1',
    comercio: 'Panadería La Espiga',
    rutEmpresa: '76.543.210-3',
    tipo: 'panaderia',
    telefono: '+56 9 5555 1201',
    nombre: 'María Fuentes',
    email: 'laespiga@ejemplo.cl',
    rut: '12.345.678-5',
    date: daysAgo(1, 18, 20),
  },
  {
    id: 'p2',
    comercio: 'Carnicería Don Lucho',
    rutEmpresa: '77.111.222-6',
    tipo: 'carniceria',
    telefono: '+56 9 5555 3402',
    nombre: 'Luis Contreras',
    email: 'donlucho@ejemplo.cl',
    rut: '9.876.543-3',
    date: daysAgo(2, 12, 5),
  },
  {
    id: 'p3',
    comercio: 'Almacén San Joaquín',
    rutEmpresa: '76.999.888-1',
    tipo: 'almacen',
    telefono: '+56 9 5555 7703',
    nombre: 'Carolina Rojas',
    email: 'sanjoaquin@ejemplo.cl',
    rut: '15.432.109-8',
    date: daysAgo(4, 9, 45),
  },
];

// ---------- usuarios ----------
export const INITIAL_USERS: AppUser[] = [
  { id: 'u1', name: 'Benjamín', email: 'admin@demo.cl', role: 'admin', active: true },
  { id: 'u2', name: 'Javier', email: 'fiscalizador@demo.cl', role: 'fiscalizador', active: true },
  { id: 'u3', name: 'Camila Soto', email: 'csoto@demo.cl', role: 'fiscalizador', active: true },
  { id: 'u4', name: 'Minimarket El Sol', email: 'comercio@demo.cl', role: 'comerciante', active: true },
  { id: 'u5', name: 'Supermercado PAC', email: 'superpac@demo.cl', role: 'comerciante', active: true },
  { id: 'u6', name: 'Rodrigo Pérez', email: 'rperez@demo.cl', role: 'fiscalizador', active: false },
];

// ---------- auditoría ----------
export const INITIAL_AUDIT: AuditEntry[] = [
  { id: 'a1', date: daysAgo(0, 11, 3), user: 'Javier', table: 'precios', operation: 'INSERT', detail: 'Captura OCR en Feria Lo Valledor · 4 precios' },
  { id: 'a2', date: daysAgo(0, 10, 15), user: 'Javier', table: 'precios', operation: 'INSERT', detail: 'Captura OCR en Almacén Doña Rosa · 4 precios' },
  { id: 'a3', date: daysAgo(0, 9, 42), user: 'Javier', table: 'precios', operation: 'INSERT', detail: 'Captura OCR en Minimarket El Sol · 3 precios' },
  { id: 'a4', date: daysAgo(0, 8, 30), user: 'Supermercado PAC', table: 'precios', operation: 'UPDATE', detail: 'Oferta en Arroz grado 1 · $1.190' },
  { id: 'a5', date: daysAgo(1, 17, 10), user: 'Benjamín', table: 'productos', operation: 'INSERT', detail: 'Nuevo producto: Zanahoria · kg' },
  { id: 'a6', date: daysAgo(1, 16, 5), user: 'Minimarket El Sol', table: 'precios', operation: 'INSERT', detail: 'Carga masiva · 12 precios en Sucursal Norte' },
  { id: 'a7', date: daysAgo(2, 12, 40), user: 'Benjamín', table: 'comercios', operation: 'UPDATE', detail: 'Horario actualizado: Feria Lo Valledor' },
  { id: 'a8', date: daysAgo(3, 9, 0), user: 'Benjamín', table: 'usuarios', operation: 'UPDATE', detail: 'Cuenta desactivada: Rodrigo Pérez' },
];

// ---------- índice de precios por categoría (base 100, últimos 6 meses) ----------
export const CATEGORY_INDEX: Record<string, number[]> = {
  abarrotes: [100, 101.3, 102.5, 105.1, 106.4, 107.6],
  lacteos: [100, 100.8, 102.3, 103.4, 104.7, 105.4],
  panaderia: [100, 103.4, 106.8, 110.2, 112.7, 114.4],
  carnes: [100, 101.4, 102.8, 105, 106.9, 108.3],
  frutas: [100, 95.1, 92.7, 90.2, 87.8, 85.4],
};

export function lastMonthsLabels(count: number) {
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return names[d.getMonth()]!;
  });
}
