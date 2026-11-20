import type { Href } from 'expo-router';

import type { StaffRole } from '@/state/AppState';

type PanelPath = '/admin' | '/fiscalizador' | '/comerciante';

/**
 * Ruta de un panel como Href.
 * Nota: en Windows, el generador de tipos de Expo Router (SDK 58) registra las rutas index anidadas
 * como "/fiscalizador/index" en vez de "/fiscalizador". La navegación funciona bien; esto solo evita
 * ese falso error de TypeScript.
 */
export function panelHref(path: PanelPath): Href {
  return path as unknown as Href;
}

/** Lista de especiales de temporada (`src/app/especiales/index.tsx`), con el mismo arreglo de tipos. */
export const SPECIALS_HREF = '/especiales' as unknown as Href;

/** Pantalla de inicio de cada perfil con sesión. */
export function panelRoute(role: StaffRole): Href {
  return panelHref(role === 'admin' ? '/admin' : role === 'fiscalizador' ? '/fiscalizador' : '/comerciante');
}
