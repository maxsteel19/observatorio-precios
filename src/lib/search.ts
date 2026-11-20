import { type Category, type Product } from '@/data/catalog';
import type { PriceEntry } from '@/data/seed';
import { CENTER, type Store } from '@/data/stores';
import { normalize } from './format';

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceFromUser(store: Pick<Store, 'lat' | 'lng'>) {
  return haversineKm(CENTER.lat, CENTER.lng, store.lat, store.lng);
}

/** Ingredientes típicos de una cazuela presentes en el catálogo. */
const RECIPES: { pattern: RegExp; label: string; productIds: string[] }[] = [
  {
    pattern: /cazuela|ingredientes|receta|almuerzo|comida/,
    label: 'ingredientes de cazuela',
    productIds: ['pollo', 'carne', 'papa', 'cebolla', 'zanahoria', 'arroz', 'aceite', 'tomate'],
  },
  {
    pattern: /desayuno|once/,
    label: 'productos para el desayuno / once',
    productIds: ['pan', 'leche', 'huevos', 'azucar'],
  },
];

const STOP_WORDS = new Set([
  'ingredientes', 'para', 'baratos', 'barato', 'baratas', 'cerca', 'precio', 'precios', 'de', 'del',
  'la', 'el', 'los', 'las', 'buscar', 'quiero', 'comprar', 'un', 'una', 'kg', 'litro',
]);

export type SearchInterpretation = {
  productIds: string[];
  /** Si la búsqueda se interpretó como intención (ej. receta), su descripción. */
  semanticLabel?: string;
};

export function interpretQuery(query: string, catalog: Product[]): SearchInterpretation {
  const q = normalize(query);
  const recipe = RECIPES.find((r) => r.pattern.test(q));
  if (recipe) {
    return { productIds: recipe.productIds, semanticLabel: recipe.label };
  }
  const words = q.split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));
  if (words.length === 0) return { productIds: catalog.map((p) => p.id) };
  const ids = catalog
    .filter((p) => {
      const haystack = [normalize(p.name), ...p.keywords.map(normalize)];
      return words.some((w) => haystack.some((h) => h.includes(w) || (w.length > 3 && w.includes(h))));
    })
    .map((p) => p.id);
  return { productIds: ids };
}

export type SearchResult = {
  store: Store;
  product: Product;
  price: PriceEntry;
  distance: number;
};

export type SearchFilters = {
  category: Category | 'all';
  maxKm: number | null;
  onlyOffers: boolean;
};

export const DEFAULT_FILTERS: SearchFilters = { category: 'all', maxKm: null, onlyOffers: false };

export type SortKey = 'price' | 'distance' | 'updated';

export function runSearch(
  interpretation: SearchInterpretation,
  data: { stores: Store[]; catalog: Product[]; prices: PriceEntry[] },
  filters: SearchFilters,
  sort: SortKey,
): SearchResult[] {
  const wanted = new Set(interpretation.productIds);
  const results: SearchResult[] = [];
  for (const price of data.prices) {
    if (!wanted.has(price.productId)) continue;
    const store = data.stores.find((s) => s.id === price.storeId);
    const product = data.catalog.find((p) => p.id === price.productId);
    if (!store || !product || !store.active || !product.active) continue;
    const distance = distanceFromUser(store);
    if (filters.category !== 'all' && product.category !== filters.category) continue;
    if (filters.maxKm != null && distance > filters.maxKm) continue;
    if (filters.onlyOffers && !price.offer) continue;
    results.push({ store, product, price, distance });
  }
  results.sort((a, b) => {
    if (sort === 'distance') return a.distance - b.distance;
    if (sort === 'updated') return new Date(b.price.updatedAt).getTime() - new Date(a.price.updatedAt).getTime();
    // Por precio: agrupa por producto y ordena de menor a mayor dentro de cada uno.
    if (a.product.id !== b.product.id) {
      return interpretation.productIds.indexOf(a.product.id) - interpretation.productIds.indexOf(b.product.id);
    }
    return a.price.price - b.price.price;
  });
  return results;
}

export const SEARCH_SUGGESTIONS = [
  'Ingredientes para cazuela baratos',
  'Arroz',
  'Leche',
  'Pan marraqueta',
  'Pollo',
  'Desayuno',
];
