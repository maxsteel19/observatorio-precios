import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabNavigationOptions } from 'expo-router/tabs';
import type { ComponentProps } from 'react';

type TabIconProps = Parameters<NonNullable<BottomTabNavigationOptions['tabBarIcon']>>[0];

/** Crea el ícono de una pestaña a partir de un nombre de Ionicons. */
export function tabIcon(name: ComponentProps<typeof Ionicons>['name']) {
  return function TabIcon({ color, size }: TabIconProps) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };
}
