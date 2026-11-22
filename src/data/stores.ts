// Comercios (sucursales) de Pedro Aguirre Cerda usados en la demo.
// `map` es la posición del pin en el mapa ilustrado, en porcentaje (0–100).

export type StoreType =
  | 'minimarket'
  | 'almacen'
  | 'feria'
  | 'supermercado'
  | 'panaderia'
  | 'carniceria'
  | 'otro';

export const STORE_TYPES: { id: StoreType; label: string }[] = [
  { id: 'minimarket', label: 'Minimarket' },
  { id: 'almacen', label: 'Almacén / Botillería' },
  { id: 'feria', label: 'Feria libre / Puesto' },
  { id: 'supermercado', label: 'Supermercado' },
  { id: 'panaderia', label: 'Panadería / Pastelería' },
  { id: 'carniceria', label: 'Carnicería / Fiambrería' },
  { id: 'otro', label: 'Otro' },
];

export type Store = {
  id: number;
  name: string;
  branch?: string;
  address: string;
  hours: string;
  phone?: string;
  lat: number;
  lng: number;
  type: StoreType;
  map: { x: number; y: number };
  /** Nombre del comercio dueño (cuenta de comerciante), si tiene una. */
  merchant?: string;
  /** Id de la cuenta de comerciante dueña (solo con backend Supabase). */
  ownerId?: string;
  /** Id del comercio (empresa) al que pertenece la sucursal (solo con backend Supabase). */
  comercioId?: number;
  /** Beneficio para quienes muestran la Tarjeta Vecina PAC (convenio de ejemplo). */
  tarjetaVecina?: string;
  active: boolean;
};

/** Centro de referencia ("tu ubicación") en Pedro Aguirre Cerda. */
export const CENTER = { lat: -33.4926, lng: -70.677 };

export const DEMO_MERCHANT = 'Minimarket El Sol';

export const INITIAL_STORES: Store[] = [
  {
    id: 1,
    name: 'Abarrotes Don José',
    address: 'Av. Departamental 1450',
    hours: 'Lun–Sáb 8:00–20:00 · Dom 9:00–14:00',
    lat: -33.4901,
    lng: -70.6742,
    type: 'almacen',
    map: { x: 25, y: 30 },
    tarjetaVecina: '5% de descuento en abarrotes',
    active: true,
  },
  {
    id: 2,
    name: 'Minimarket La Esquina',
    address: 'Calle Ochagavía 890',
    hours: 'Lun–Dom 7:30–22:00',
    lat: -33.4945,
    lng: -70.6798,
    type: 'minimarket',
    map: { x: 48, y: 40 },
    active: true,
  },
  {
    id: 3,
    name: 'Supermercado PAC',
    address: 'Av. Central 320',
    hours: 'Lun–Dom 8:00–21:00',
    lat: -33.4912,
    lng: -70.6815,
    type: 'supermercado',
    map: { x: 60, y: 28 },
    merchant: 'Supermercado PAC',
    active: true,
  },
  {
    id: 4,
    name: 'Almacén Doña Rosa',
    address: 'Pasaje Los Maitenes 45',
    hours: 'Lun–Sáb 9:00–19:00',
    lat: -33.4968,
    lng: -70.6725,
    type: 'almacen',
    map: { x: 35, y: 62 },
    tarjetaVecina: '10% de descuento en pan y lácteos',
    active: true,
  },
  {
    id: 5,
    name: 'Comercial Los Andes',
    address: 'Av. Lo Ovalle 2100',
    hours: 'Lun–Sáb 8:30–20:30 · Dom cerrado',
    lat: -33.4889,
    lng: -70.6688,
    type: 'minimarket',
    map: { x: 75, y: 45 },
    active: true,
  },
  {
    id: 6,
    name: 'Feria Lo Valledor',
    branch: 'Puesto 12',
    address: 'Mercado Lo Valledor',
    hours: 'Mar–Dom 6:00–15:00',
    lat: -33.4995,
    lng: -70.6832,
    type: 'feria',
    map: { x: 20, y: 78 },
    tarjetaVecina: '8% de descuento en frutas y verduras',
    active: true,
  },
  {
    id: 7,
    name: DEMO_MERCHANT,
    branch: 'Sucursal Principal',
    address: 'Av. Departamental 2450',
    hours: 'Lun–Dom 8:00–22:00',
    phone: '+56 2 2555 0101',
    lat: -33.493,
    lng: -70.676,
    type: 'minimarket',
    map: { x: 54, y: 72 },
    tarjetaVecina: '5% de descuento en toda la compra',
    merchant: DEMO_MERCHANT,
    active: true,
  },
  {
    id: 8,
    name: DEMO_MERCHANT,
    branch: 'Sucursal Norte',
    address: 'Av. Lo Ovalle 980',
    hours: 'Lun–Sáb 9:00–21:00',
    phone: '+56 2 2555 0102',
    lat: -33.488,
    lng: -70.68,
    type: 'minimarket',
    map: { x: 88, y: 62 },
    tarjetaVecina: '5% de descuento en toda la compra',
    merchant: DEMO_MERCHANT,
    active: true,
  },
];

export function storeLabel(s: Pick<Store, 'name' | 'branch'>) {
  return s.branch ? `${s.name} · ${s.branch}` : s.name;
}

export function storeInitials(s: Pick<Store, 'name'>) {
  return s.name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function storeTypeLabel(id: StoreType) {
  return STORE_TYPES.find((t) => t.id === id)?.label ?? id;
}
