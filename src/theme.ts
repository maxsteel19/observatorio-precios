// Paleta tomada del logo de la Municipalidad de Pedro Aguirre Cerda:
// azul institucional como base, verde para las acciones, naranja para ofertas
// y amarillo / celeste / rojo como acentos puntuales.
export const colors = {
  // Azul institucional (fondo del logo)
  primary: '#124280',
  primaryDark: '#0B2E5E',
  primaryLight: '#E8EFF8',
  // Verde del logo, oscurecido para que el texto blanco sea legible
  action: '#3F7D17',
  actionBright: '#7DB33A',
  actionLight: '#EEF6E3',
  lime: '#9DC33D',
  // Ofertas
  accent: '#E8590C',
  accentDark: '#B9470A',
  accentLight: '#FFF1E6',
  // Acentos del logo
  yellow: '#F7B52C',
  yellowLight: '#FFF6DC',
  sky: '#1E9BD7',
  skyLight: '#E4F4FC',
  red: '#D52B34',
  // Estados
  success: '#3F7D17',
  successLight: '#EEF6E3',
  warning: '#9A5B00',
  warningLight: '#FFF6DC',
  danger: '#C62828',
  dangerLight: '#FDECEA',
  info: '#0B6FA4',
  infoLight: '#E4F4FC',
  // Superficies y texto
  bg: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EFF2F7',
  text: '#14233F',
  textSecondary: '#5A6478',
  textMuted: '#8A93A6',
  border: '#E3E8F0',
  white: '#FFFFFF',
  overlay: 'rgba(11, 25, 50, 0.5)',
  // Mapa ilustrado
  mapBg: '#E6ECF4',
  mapStreet: '#FFFFFF',
  mapStreetMain: '#FFF3D1',
  mapPark: '#D3E8BE',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = {
  card: { boxShadow: '0 4px 14px rgba(18, 66, 128, 0.08)' },
  raised: { boxShadow: '0 12px 28px rgba(18, 66, 128, 0.16)' },
} as const;

export const font = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 30,
};

/** Plus Jakarta Sans: se carga en `src/app/_layout.tsx`. Si no carga, se usa la fuente del sistema. */
export const fonts = {
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

export type Role = 'ciudadano' | 'fiscalizador' | 'comerciante' | 'admin';

export const roleInfo: Record<Role, { label: string; color: string; bg: string }> = {
  ciudadano: { label: 'Ciudadano', color: colors.primary, bg: colors.primaryLight },
  fiscalizador: { label: 'Fiscalizador', color: colors.info, bg: colors.infoLight },
  comerciante: { label: 'Comerciante', color: colors.accentDark, bg: colors.accentLight },
  admin: { label: 'Administrador', color: '#37474F', bg: '#ECEFF1' },
};
