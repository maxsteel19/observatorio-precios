// Precios de combustibles en estaciones de servicio de Pedro Aguirre Cerda.
// Son datos de ejemplo: el Observatorio Municipal publica los valores reales en sus redes.
import { daysAgo } from './seed';

export type FuelType = '93' | '95' | '97' | 'diesel' | 'parafina';

export const FUELS: { id: FuelType; label: string; short: string }[] = [
  { id: '93', label: 'Bencina 93', short: '93' },
  { id: '95', label: 'Bencina 95', short: '95' },
  { id: '97', label: 'Bencina 97', short: '97' },
  { id: 'diesel', label: 'Diésel', short: 'Diésel' },
  { id: 'parafina', label: 'Parafina', short: 'Parafina' },
];

export type Station = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Posición en el mapa ilustrado (porcentaje). */
  map: { x: number; y: number };
  /** Precio por litro; si falta, la estación no vende ese combustible. */
  prices: Partial<Record<FuelType, number>>;
};

export const STATIONS: Station[] = [
  {
    id: 1,
    name: 'Estación Club Hípico',
    address: 'Av. Club Hípico 5900',
    lat: -33.4932,
    lng: -70.6618,
    map: { x: 26, y: 32 },
    prices: { '93': 1289, '95': 1329, '97': 1389, diesel: 1019, parafina: 1199 },
  },
  {
    id: 2,
    name: 'Estación Departamental',
    address: 'Av. Departamental 1880',
    lat: -33.4905,
    lng: -70.6702,
    map: { x: 52, y: 42 },
    prices: { '93': 1265, '95': 1309, '97': 1372, diesel: 999 },
  },
  {
    id: 3,
    name: 'Estación Carlos Valdovinos',
    address: 'Av. Carlos Valdovinos 3100',
    lat: -33.4842,
    lng: -70.6795,
    map: { x: 80, y: 46 },
    prices: { '93': 1299, '95': 1345, '97': 1405, diesel: 1029, parafina: 1185 },
  },
  {
    id: 4,
    name: 'Estación Lo Ovalle',
    address: 'Av. Lo Ovalle 1550',
    lat: -33.4986,
    lng: -70.6741,
    map: { x: 36, y: 72 },
    prices: { '93': 1249, '95': 1295, '97': 1359, diesel: 989, parafina: 1219 },
  },
  {
    id: 5,
    name: 'Estación Isabel Riquelme',
    address: 'Av. Isabel Riquelme 2650',
    lat: -33.4878,
    lng: -70.685,
    map: { x: 70, y: 78 },
    prices: { '93': 1279, '95': 1319, '97': 1379, diesel: 1009 },
  },
];

/** Fecha de la última revisión del observatorio. */
export const FUEL_UPDATED = daysAgo(2, 11, 30);

export function cheapestStation(fuel: FuelType) {
  return STATIONS.filter((s) => s.prices[fuel] != null).sort((a, b) => a.prices[fuel]! - b.prices[fuel]!)[0];
}
