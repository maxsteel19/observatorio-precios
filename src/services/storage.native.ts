// Almacenamiento de la sesión en Android/iOS: localStorage sobre SQLite (expo-sqlite),
// como recomienda la guía de Expo para Supabase.
import 'expo-sqlite/localStorage/install';

export const authStorage: Storage | undefined = globalThis.localStorage;
