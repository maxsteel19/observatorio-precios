// Catálogo municipal de productos de la canasta básica.
// Los comerciantes y fiscalizadores solo pueden registrar precios de productos de este catálogo.
import { ICON_NAMES, type IconName } from '@/components/icons/definitions';

export type Category = 'abarrotes' | 'lacteos' | 'panaderia' | 'carnes' | 'frutas';

// Colores tomados del logo municipal; `tint` es el fondo suave de los mosaicos.
export const CATEGORIES: { id: Category; label: string; short: string; icon: IconName; color: string; tint: string }[] = [
  { id: 'abarrotes', label: 'Abarrotes', short: 'Abarrotes', icon: 'arroz', color: '#124280', tint: '#E8EFF8' },
  { id: 'lacteos', label: 'Lácteos y huevos', short: 'Lácteos', icon: 'leche', color: '#1E9BD7', tint: '#E4F4FC' },
  { id: 'panaderia', label: 'Panadería', short: 'Panadería', icon: 'pan', color: '#D9930F', tint: '#FFF6DC' },
  { id: 'carnes', label: 'Carnes', short: 'Carnes', icon: 'pollo', color: '#D52B34', tint: '#FDECEC' },
  { id: 'frutas', label: 'Frutas y verduras', short: 'Verduras', icon: 'zanahoria', color: '#5E9A1E', tint: '#EEF6E3' },
];

/**
 * Ilustración del producto. Los 14 productos del catálogo inicial tienen un ícono con su mismo id;
 * los que agregue el administrador usan el ícono de su categoría.
 */
export function productIcon(product: Pick<Product, 'id' | 'category'>): IconName {
  if ((ICON_NAMES as string[]).includes(product.id)) return product.id as IconName;
  return CATEGORIES.find((c) => c.id === product.category)?.icon ?? 'canasta';
}

export function categoryTint(category: Category) {
  return CATEGORIES.find((c) => c.id === category)?.tint ?? '#EFF2F7';
}

export const UNITS = ['1 kg', 'kg', '1 L', '400 g', '12 un', 'unidad'] as const;

export type Product = {
  id: string;
  name: string;
  unit: string;
  category: Category;
  brand?: string;
  active: boolean;
  /** Palabras que ayudan a encontrar el producto en la búsqueda. */
  keywords: string[];
};

export const INITIAL_CATALOG: Product[] = [
  { id: 'arroz', name: 'Arroz grado 1', unit: '1 kg', category: 'abarrotes', active: true, keywords: ['arroz'] },
  { id: 'aceite', name: 'Aceite vegetal', unit: '1 L', category: 'abarrotes', active: true, keywords: ['aceite', 'maravilla'] },
  { id: 'azucar', name: 'Azúcar granulada', unit: '1 kg', category: 'abarrotes', active: true, keywords: ['azucar'] },
  { id: 'harina', name: 'Harina', unit: '1 kg', category: 'abarrotes', active: true, keywords: ['harina'] },
  { id: 'fideos', name: 'Fideos spaghetti', unit: '400 g', category: 'abarrotes', active: true, keywords: ['fideos', 'tallarines', 'pasta'] },
  { id: 'leche', name: 'Leche entera', unit: '1 L', category: 'lacteos', active: true, keywords: ['leche'] },
  { id: 'huevos', name: 'Huevos blancos', unit: '12 un', category: 'lacteos', active: true, keywords: ['huevo', 'huevos'] },
  { id: 'pan', name: 'Pan marraqueta', unit: 'kg', category: 'panaderia', active: true, keywords: ['pan', 'marraqueta', 'batido'] },
  { id: 'pollo', name: 'Pollo entero', unit: 'kg', category: 'carnes', active: true, keywords: ['pollo'] },
  { id: 'carne', name: 'Carne molida', unit: 'kg', category: 'carnes', active: true, keywords: ['carne', 'vacuno', 'molida'] },
  { id: 'tomate', name: 'Tomate', unit: 'kg', category: 'frutas', active: true, keywords: ['tomate'] },
  { id: 'papa', name: 'Papa', unit: 'kg', category: 'frutas', active: true, keywords: ['papa', 'papas'] },
  { id: 'cebolla', name: 'Cebolla', unit: 'kg', category: 'frutas', active: true, keywords: ['cebolla'] },
  { id: 'zanahoria', name: 'Zanahoria', unit: 'kg', category: 'frutas', active: true, keywords: ['zanahoria'] },
];

export function productLabel(p: Pick<Product, 'name' | 'unit'>) {
  return `${p.name} · ${p.unit}`;
}

export function categoryLabel(id: Category) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
