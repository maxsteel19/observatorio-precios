// Especiales de temporada del Observatorio Municipal de Precios: comparativas de productos típicos
// de cada fecha, destacando a emprendedoras y comerciantes locales. Precios y negocios de ejemplo.
import type { IconName } from '@/components/icons';

export type SpecialOption = { store: string; price: number; local?: boolean };
export type SpecialItem = { name: string; unit: string; icon: IconName; options: SpecialOption[] };
export type Special = {
  id: string;
  title: string;
  icon: IconName;
  period: string;
  /** Meses (1–12) en que el especial está vigente. */
  months: number[];
  colors: [string, string];
  summary: string;
  description: string;
  items: SpecialItem[];
};

export const SPECIALS: Special[] = [
  {
    id: 'navidad',
    title: 'Navidad',
    icon: 'arbol',
    period: 'Diciembre 2026',
    months: [11, 12],
    colors: ['#2E8B4A', '#14532D'],
    summary: 'Pan de pascua, regalos y la cena',
    description:
      'Comparamos los productos típicos de la Navidad en comercios y emprendimientos de la comuna, para que compres cerca y a buen precio.',
    items: [
      {
        name: 'Pan de pascua',
        unit: '1 kg',
        icon: 'pandepascua',
        options: [
          { store: 'Panadería La Victoria', price: 5990, local: true },
          { store: 'Supermercado PAC', price: 6490 },
          { store: 'Pastelería Dulce Hogar', price: 6990, local: true },
        ],
      },
      {
        name: 'Cola de mono',
        unit: '1 L',
        icon: 'leche',
        options: [
          { store: 'Sabores de Antaño', price: 4500, local: true },
          { store: 'Comercial Los Andes', price: 5290 },
        ],
      },
      {
        name: 'Pollo entero',
        unit: 'kg',
        icon: 'pollo',
        options: [
          { store: 'Feria Lo Valledor · Puesto 12', price: 2290 },
          { store: 'Supermercado PAC', price: 2490 },
        ],
      },
      {
        name: 'Juguete didáctico',
        unit: 'unidad',
        icon: 'regalo',
        options: [
          { store: 'Juguetería Don Tito', price: 7990, local: true },
          { store: 'Bazar La Estrella', price: 8990, local: true },
        ],
      },
      {
        name: 'Luces navideñas',
        unit: '100 luces',
        icon: 'estrella',
        options: [
          { store: 'Bazar La Estrella', price: 3990, local: true },
          { store: 'Ferretería El Maestro', price: 4590 },
        ],
      },
    ],
  },
  {
    id: 'utiles',
    title: 'Útiles escolares',
    icon: 'mochila',
    period: 'Marzo 2027',
    months: [2, 3],
    colors: ['#1E88D0', '#0B4F8A'],
    summary: 'Cuadernos, mochilas y estuches',
    description: 'Una guía para preparar la vuelta a clases comprando en las librerías y bazares de la comuna.',
    items: [
      {
        name: 'Cuaderno universitario',
        unit: '100 hojas',
        icon: 'cuaderno',
        options: [
          { store: 'Librería El Estudiante', price: 1290, local: true },
          { store: 'Bazar La Estrella', price: 1490, local: true },
          { store: 'Supermercado PAC', price: 1590 },
        ],
      },
      {
        name: 'Lápices de colores',
        unit: 'caja de 12',
        icon: 'lapiz',
        options: [
          { store: 'Bazar La Estrella', price: 1990, local: true },
          { store: 'Librería El Estudiante', price: 2190, local: true },
        ],
      },
      {
        name: 'Mochila escolar',
        unit: 'unidad',
        icon: 'mochila',
        options: [
          { store: 'Confecciones Lo Valledor', price: 12990, local: true },
          { store: 'Comercial Los Andes', price: 15990 },
        ],
      },
      {
        name: 'Estuche',
        unit: 'unidad',
        icon: 'lapiz',
        options: [
          { store: 'Librería El Estudiante', price: 2490, local: true },
          { store: 'Bazar La Estrella', price: 2790, local: true },
        ],
      },
    ],
  },
  {
    id: 'halloween',
    title: 'Halloween',
    icon: 'calabaza',
    period: 'Octubre 2026',
    months: [10],
    colors: ['#F07A1A', '#9C3B07'],
    summary: 'Disfraces, dulces y decoración',
    description:
      'Que este Halloween no te asusten los precios: disfraces, dulces y decoración en emprendimientos y comercios de Pedro Aguirre Cerda.',
    items: [
      {
        name: 'Disfraz infantil',
        unit: 'unidad',
        icon: 'mascara',
        options: [
          { store: 'Disfraces Mágicos', price: 9990, local: true },
          { store: 'Bazar La Estrella', price: 11990, local: true },
        ],
      },
      {
        name: 'Dulces surtidos',
        unit: '1 kg',
        icon: 'dulce',
        options: [
          { store: 'Dulces Rosita', price: 4990, local: true },
          { store: 'Minimarket La Esquina', price: 5490 },
          { store: 'Supermercado PAC', price: 5990 },
        ],
      },
      {
        name: 'Calabaza',
        unit: 'unidad',
        icon: 'calabaza',
        options: [
          { store: 'Feria Lo Valledor · Puesto 12', price: 2500 },
          { store: 'Almacén Doña Rosa', price: 2990 },
        ],
      },
      {
        name: 'Maquillaje de fantasía',
        unit: 'set',
        icon: 'estrella',
        options: [
          { store: 'Disfraces Mágicos', price: 3490, local: true },
          { store: 'Bazar La Estrella', price: 3990, local: true },
        ],
      },
    ],
  },
  {
    id: 'fiestas-patrias',
    title: 'Fiestas Patrias',
    icon: 'volantin',
    period: 'Septiembre 2026',
    months: [9],
    colors: ['#D52B34', '#124280'],
    summary: 'Empanadas, asado y volantines',
    description: 'Lo necesario para celebrar el 18 en la comuna: empanadas, carne para el asado, bebidas y volantines.',
    items: [
      {
        name: 'Empanada de pino',
        unit: 'unidad',
        icon: 'empanada',
        options: [
          { store: 'Panadería La Victoria', price: 1500, local: true },
          { store: 'Sabores de Antaño', price: 1700, local: true },
          { store: 'Supermercado PAC', price: 1890 },
        ],
      },
      {
        name: 'Carne para asado',
        unit: 'kg',
        icon: 'carne',
        options: [
          { store: 'Carnicería El Corralero', price: 8990, local: true },
          { store: 'Supermercado PAC', price: 9490 },
        ],
      },
      {
        name: 'Longaniza',
        unit: 'kg',
        icon: 'carne',
        options: [
          { store: 'Carnicería El Corralero', price: 5490, local: true },
          { store: 'Comercial Los Andes', price: 5990 },
        ],
      },
      {
        name: 'Volantín',
        unit: 'unidad',
        icon: 'volantin',
        options: [
          { store: 'Bazar La Estrella', price: 1000, local: true },
          { store: 'Minimarket La Esquina', price: 1200 },
        ],
      },
    ],
  },
];

export type SpecialStatus = 'vigente' | 'proximo' | 'anterior';

export function specialStatus(special: Special, now = new Date()): SpecialStatus {
  const month = now.getMonth() + 1;
  if (special.months.includes(month)) return 'vigente';
  const ahead = Math.min(...special.months.map((m) => (m - month + 12) % 12));
  return ahead <= 4 ? 'proximo' : 'anterior';
}

export const STATUS_LABEL: Record<SpecialStatus, string> = {
  vigente: 'Vigente',
  proximo: 'Próximamente',
  anterior: 'Edición anterior',
};

/** Vigentes primero, luego los próximos y al final los anteriores. */
export function sortedSpecials(now = new Date()) {
  const order: Record<SpecialStatus, number> = { vigente: 0, proximo: 1, anterior: 2 };
  return [...SPECIALS].sort((a, b) => order[specialStatus(a, now)] - order[specialStatus(b, now)]);
}

export function sortedOptions(item: SpecialItem) {
  return [...item.options].sort((a, b) => a.price - b.price);
}
