import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';

import { ToastProvider } from '@/components/Toast';
import { AppStateProvider, useApp } from '@/state/AppState';
import { colors } from '@/theme';

export default function RootLayout() {
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
  outer: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#1B2228' : colors.bg },
  app: { flex: 1, width: '100%', backgroundColor: colors.bg, overflow: 'hidden' },
  phone: { maxWidth: 480, alignSelf: 'center', boxShadow: '0 0 60px rgba(0,0,0,0.45)' },
});
