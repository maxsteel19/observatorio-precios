// Tokens del set de íconos: lienzo, paleta (pares claro → oscuro para degradados), luz y sombra.
// Todas las ilustraciones usan solo estos valores para verse como una misma familia.

/** Lienzo común de todos los íconos. */
export const VIEWBOX = '0 0 48 48';

/** Cada color es un par [claro, oscuro]; el degradado vertical va de arriba (luz) hacia abajo. */
export const PALETTE = {
  navy: ['#3E7CC9', '#123E7A'],
  sky: ['#86D6F8', '#1E8BC8'],
  green: ['#9BD65C', '#3F7D17'],
  lime: ['#D6EC7E', '#8DB532'],
  orange: ['#FFB26B', '#E8590C'],
  red: ['#FF7E83', '#C2252E'],
  yellow: ['#FFE380', '#F0A81C'],
  cream: ['#FFFDF6', '#EAD3A8'],
  white: ['#FFFFFF', '#D5DFEC'],
  bread: ['#F7C77E', '#C27A2E'],
  brown: ['#C98A52', '#7E4519'],
  roast: ['#F5AE5F', '#B8551D'],
  potato: ['#EDCB92', '#AE7838'],
  gray: ['#EEF2F7', '#9AA8BC'],
  steel: ['#C3CEDC', '#5E6E86'],
  pink: ['#FFB8C9', '#E05A7E'],
  purple: ['#C792E3', '#7A3BA8'],
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** Sombra de suelo bajo cada objeto (misma luz para todo el set: arriba a la izquierda). */
export const GROUND = { cx: 24, cy: 43.6, rx: 13, ry: 2.6, color: '#0B2E5E', opacity: 0.14 };

/** Brillos y líneas de detalle. */
export const HIGHLIGHT = '#FFFFFF';
export const DETAIL_STROKE = 1.6;
