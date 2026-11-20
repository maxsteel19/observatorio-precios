import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ToastProvider } from '@/components/Toast';
import { AppStateProvider, useApp } from '@/state/AppState';
import { colors } from '@/theme';

// La pantalla de carga (logo municipal sobre azul) se mantiene hasta que carga la fuente.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <AppStateProvider>
      <RootNavigator />
      <StatusBar style="light" />
    </AppStateProvider>
  );
}

function RootNavigator() {
  const { session } = useApp();
  const segments = useSegments();
  // El panel de administración usa todo el ancho; el resto se ve como teléfono en pantallas grandes.
  const wide = segments[0] === 'admin';

  return (
    <View style={styles.outer}>
      <View style={[styles.app, !wide && styles.phone]}>
        <ToastProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              title: 'Observatorio de Precios PAC',
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}>
            {/* Cada panel solo es accesible con la sesión del perfil correspondiente.
                Al cerrar sesión, Expo Router vuelve automáticamente al inicio. */}
            <Stack.Protected guard={session?.role === 'fiscalizador'}>
              <Stack.Screen name="fiscalizador" />
            </Stack.Protected>
            <Stack.Protected guard={session?.role === 'comerciante'}>
              <Stack.Screen name="comerciante" />
            </Stack.Protected>
            <Stack.Protected guard={session?.role === 'admin'}>
              <Stack.Screen name="admin" />
            </Stack.Protected>
          </Stack>
        </ToastProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#0A1A33' : colors.bg },
  app: { flex: 1, width: '100%', backgroundColor: colors.bg, overflow: 'hidden' },
  phone: { maxWidth: 480, alignSelf: 'center', boxShadow: '0 0 60px rgba(0,0,0,0.45)' },
});
