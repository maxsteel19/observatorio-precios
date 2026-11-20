// Validación y formato de RUT chileno (dígito verificador módulo 11).

export function cleanRut(rut: string) {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function computeDv(body: string) {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]!, 10) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const dv = 11 - (sum % 11);
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return String(dv);
}

export function isValidRut(rut: string) {
  const clean = cleanRut(rut);
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body) || body.length < 7) return false;
  return computeDv(body) === dv;
}

export function formatRut(rut: string) {
  const clean = cleanRut(rut);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${body}-${clean.slice(-1)}`;
}
