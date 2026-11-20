import { Tabs } from 'expo-router/tabs';
import { useWindowDimensions } from 'react-native';

import { tabIcon as icon } from '@/components/TabIcon';
import { useApp } from '@/state/AppState';
import { colors } from '@/theme';

export default function AdminLayout() {
  const { width } = useWindowDimensions();
  const { pending } = useApp();
  // En pantallas anchas (computador en la feria) las pestañas pasan a ser una barra lateral.
  const wide = width >= 900;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        tabBarLabelPosition: wide ? 'beside-icon' : 'below-icon',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarActiveBackgroundColor: wide ? colors.primaryLight : undefined,
        tabBarStyle: wide
          ? { backgroundColor: colors.surface, borderRightColor: colors.border, width: 230, paddingTop: 12 }
          : { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarItemStyle: wide ? { borderRadius: 10, marginHorizontal: 10, marginVertical: 2, maxHeight: 48 } : undefined,
        tabBarLabelStyle: { fontSize: wide ? 14 : 10, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Panel', tabBarIcon: icon('grid-outline') }} />
      <Tabs.Screen name="catalogo" options={{ title: 'Catálogo', tabBarIcon: icon('cube-outline') }} />
      <Tabs.Screen name="comercios" options={{ title: 'Comercios', tabBarIcon: icon('storefront-outline') }} />
      <Tabs.Screen
        name="cuentas"
        options={{
          title: 'Cuentas',
          tabBarIcon: icon('person-add-outline'),
          tabBarBadge: pending.length > 0 ? pending.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent },
        }}
      />
      <Tabs.Screen name="usuarios" options={{ title: 'Usuarios', tabBarIcon: icon('people-outline') }} />
      <Tabs.Screen name="auditoria" options={{ title: 'Auditoría', tabBarIcon: icon('shield-checkmark-outline') }} />
    </Tabs>
  );
}
