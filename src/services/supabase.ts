// Cliente de Supabase (base de datos Postgres + Auth + Edge Functions).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { SUPABASE_CONFIGURED, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';
import type { Database } from './database.types';
import { authStorage } from './storage';

export type Db = SupabaseClient<Database>;

export const supabase: Db | null = SUPABASE_CONFIGURED
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: authStorage != null,
        detectSessionInUrl: false,
      },
    })
  : null;

// En el celular, renueva el token solo mientras la app está en primer plano.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
