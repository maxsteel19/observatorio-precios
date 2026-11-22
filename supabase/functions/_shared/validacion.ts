// Validación de entradas compartida por las Edge Functions (Deno).
// Repite en el servidor las reglas de la app: un cliente modificado no puede saltárselas.

export const TIPOS_COMERCIO = ['minimarket', 'almacen', 'feria', 'supermercado', 'panaderia', 'carniceria', 'otro'] as const;
export const ROLES = ['admin', 'fiscalizador', 'comerciante'] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function limpiarRut(rut: string) {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function esRutValido(rut: unknown): boolean {
  if (typeof rut !== 'string') return false;
  const limpio = limpiarRut(rut);
  if (limpio.length < 8) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === esperado;
}

export function formatearRut(rut: string) {
  const limpio = limpiarRut(rut);
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpo}-${limpio.slice(-1)}`;
}

export function esEmailValido(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL.test(email.trim());
}

export function texto(valor: unknown, min: number, max: number): string | null {
  if (typeof valor !== 'string') return null;
  const t = valor.trim();
  return t.length >= min && t.length <= max ? t : null;
}

export type ErroresCampos = Record<string, string>;

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function respuesta(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
