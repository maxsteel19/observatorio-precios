// Utilidades para las pruebas de integración contra el proyecto Supabase real.
// Las cuentas son las de prueba de supabase/seed.sql (contraseña demo1234).
import { createClient } from '@supabase/supabase-js';

export const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!URL || !KEY) {
  throw new Error('Faltan EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (copia .env.example a .env.local)');
}

export const CUENTAS = {
  admin: 'admin@demo.cl',
  fiscalizador: 'fiscalizador@demo.cl',
  comerciante: 'comercio@demo.cl', // dueño de Minimarket El Sol (sucursales 7 y 8)
  otroComerciante: 'superpac@demo.cl', // dueño de Supermercado PAC (sucursal 3)
  inactivo: 'rperez@demo.cl', // fiscalizador desactivado
};

export const SUCURSAL_PROPIA = 7;
export const SUCURSAL_AJENA = 3;

/** Cliente sin sesión (ciudadano anónimo). */
export function anonimo() {
  return createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Cliente con la sesión iniciada de una cuenta de prueba. */
export async function conSesion(email, password = 'demo1234') {
  const db = anonimo();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`No se pudo iniciar sesión con ${email}: ${error.message}`);
  return db;
}

/** Imprime el resultado para dejar evidencia en la salida de la prueba. */
export function evidencia(titulo, valor) {
  console.log(`  → ${titulo}: ${typeof valor === 'string' ? valor : JSON.stringify(valor)}`);
}
