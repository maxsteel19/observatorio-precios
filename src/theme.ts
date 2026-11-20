// Paleta y medidas tomadas del mockup HTML del Observatorio de Precios PAC.
export const colors = {
  primary: '#0D7377',
  primaryDark: '#0A5C5F',
  primaryLight: '#E6F4F4',
  accent: '#FF6B35',
  accentLight: '#FFF0EB',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#B26A00',
  warningLight: '#FFF6DD',
  danger: '#C62828',
  dangerLight: '#FDECEA',
  info: '#1565C0',
  infoLight: '#E3F2FD',
  bg: '#F5F7F8',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#5A6570',
  border: '#E2E8F0',
  white: '#FFFFFF',
  overlay: 'rgba(15, 20, 25, 0.45)',
  // Mapa ilustrado
  mapBg: '#E8EEF3',
  mapStreet: '#FFFFFF',
  mapStreetMain: '#F5F5F5',
  mapPark: '#C5E1A5',
};

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = {
  card: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  raised: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
} as const;

export const font = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
};

export type Role = 'ciudadano' | 'fiscalizador' | 'comerciante' | 'admin';

export const roleInfo: Record<Role, { label: string; color: string; bg: string }> = {
  ciudadano: { label: 'Ciudadano', color: colors.primaryDark, bg: colors.primaryLight },
  fiscalizador: { label: 'Fiscalizador', color: colors.info, bg: colors.infoLight },
  comerciante: { label: 'Comerciante', color: colors.accent, bg: colors.accentLight },
  admin: { label: 'Administrador', color: '#37474F', bg: '#ECEFF1' },
};
