// Configuración del entorno, leída de variables EXPO_PUBLIC_* (ver .env.example).
// La URL y la clave publicable de Supabase son públicas por diseño: la seguridad la dan las políticas RLS.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

/** Nombre del entorno que se muestra en la app (desarrollo, producción, pruebas…). */
export const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'desarrollo' : 'produccion');

export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

export const PLATFORM = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';

/** true si hay backend configurado; si no, la app funciona en modo demo con datos en memoria. */
export const SUPABASE_CONFIGURED = /^https:\/\/.+/.test(SUPABASE_URL) && SUPABASE_PUBLISHABLE_KEY.length > 20;
