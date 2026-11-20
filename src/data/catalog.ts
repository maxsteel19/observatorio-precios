// Catálogo municipal de productos de la canasta básica.
// Los comerciantes y fiscalizadores solo pueden registrar precios de productos de este catálogo.

export type Category = 'abarrotes' | 'lacteos' | 'panaderia' | 'carnes' | 'frutas';

export const CATEGORIES: { id: Category; label: string; color: string }[] = [
  { id: 'abarrotes', label: 'Abarrotes', color: '#0D7377' },
  { id: 'lacteos', label: 'Lácteos y huevos', color: '#1565C0' },
  { id: 'panaderia', label: 'Panadería', color: '#B26A00' },
  { id: 'carnes', label: 'Carnes', color: '#C62828' },
  { id: 'frutas', label: 'Frutas y verduras', color: '#2E7D32' },
];

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
