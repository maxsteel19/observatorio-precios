import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Pestañas del comerciante + pantallas que se abren encima (formulario de sucursal y carga masiva).
export default function MerchantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sucursal" />
      <Stack.Screen name="carga" />
    </Stack>
  );
}
