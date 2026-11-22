// Monitoreo: mide cuánto tarda cada operación con el backend y la registra.
// - En la consola (visible en la terminal de Expo / herramientas del navegador).
// - En la tabla eventos_app de Supabase (solo el administrador puede leerla).
import { APP_VERSION, PLATFORM } from './config';
import { supabase } from './supabase';

export type LogLevel = 'info' | 'warn' | 'error';

/** Una operación que tarda más que esto se registra como advertencia. */
export const SLOW_MS = 1500;

type LogEvent = { level: LogLevel; operation: string; durationMs?: number; message?: string };

export function logEvent({ level, operation, durationMs, message }: LogEvent) {
  const line = `[${level.toUpperCase()}] ${operation}${durationMs != null ? ` ${durationMs} ms` : ''}${message ? ` · ${message}` : ''}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  if (!supabase) return;
  // Envío "fire and forget": el monitoreo nunca debe bloquear ni romper la app.
  void supabase
    .from('eventos_app')
    .insert({
      nivel: level,
      operacion: operation.slice(0, 60),
      duracion_ms: durationMs != null ? Math.min(Math.round(durationMs), 600000) : null,
      mensaje: message?.slice(0, 500) ?? null,
      plataforma: PLATFORM,
      version_app: APP_VERSION.slice(0, 20),
    })
    .then(({ error }) => {
      if (error) console.warn(`[WARN] No se pudo registrar el evento: ${error.message}`);
    });
}

/**
 * Ejecuta una operación midiendo su duración.
 * Las escrituras (`track: true`) siempre quedan registradas; las lecturas solo si son lentas o fallan.
 */
export async function measure<T>(operation: string, fn: () => Promise<T>, { track = false } = {}): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    if (durationMs > SLOW_MS) logEvent({ level: 'warn', operation, durationMs, message: 'Operación lenta' });
    else if (track) logEvent({ level: 'info', operation, durationMs });
    return result;
  } catch (e) {
    logEvent({ level: 'error', operation, durationMs: Date.now() - start, message: errorMessage(e) });
    throw e;
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e && 'message' in e) return String((e as { message: unknown }).message);
  return String(e);
}
