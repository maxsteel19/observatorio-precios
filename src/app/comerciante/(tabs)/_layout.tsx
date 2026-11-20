import { Tabs } from 'expo-router/tabs';

import { tabIcon } from '@/components/TabIcon';
import { colors } from '@/theme';

export default function MerchantLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="precio"
        options={{ title: 'Precio', tabBarIcon: tabIcon('pricetag-outline') }}
      />
      <Tabs.Screen
        name="sucursales"
        options={{ title: 'Sucursales', tabBarIcon: tabIcon('storefront-outline') }}
      />
      <Tabs.Screen
        name="historial"
        options={{ title: 'Historial', tabBarIcon: tabIcon('time-outline') }}
      />
    </Tabs>
  );
}
