export function formatPrice(n: number) {
  // Formato chileno: $1.290 (Intl puede no estar completo en todos los motores, así que lo hacemos a mano).
  const rounded = Math.round(n);
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${rounded < 0 ? '-' : ''}$${digits}`;
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

export function formatPercent(n: number, decimals = 1) {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals).replace('.', ',')}%`;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function daysBetween(iso: string, now = new Date()) {
  return Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86400000);
}

/** "hoy", "ayer", "hace 3 días", "12 sep". */
export function formatRelativeDay(iso: string) {
  const diff = daysBetween(iso);
  if (diff <= 0) return 'hoy';
  if (diff === 1) return 'ayer';
  if (diff < 7) return `hace ${diff} días`;
  return formatShortDate(iso);
}

export function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/** "Hoy, 10:32" · "Ayer, 16:05" · "23 sep, 09:15". */
export function formatDateTime(iso: string) {
  const diff = daysBetween(iso);
  const day = diff <= 0 ? 'Hoy' : diff === 1 ? 'Ayer' : formatShortDate(iso);
  return `${day}, ${formatTime(iso)}`;
}

export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Convierte "1.290" o "$1290" en 1290. Devuelve NaN si no hay dígitos. */
export function parsePrice(text: string) {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : NaN;
}
