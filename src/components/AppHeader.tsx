import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, roleInfo, spacing, type Role } from '@/theme';
import { IconButton } from './ui';

export function AppHeader({
  title,
  back,
  backTo = '/',
  onBack,
  right,
  role,
}: {
  title: string;
  /** Muestra la flecha para volver. */
  back?: boolean;
  /** Ruta a la que volver si no hay historial (ej. al recargar en web). */
  backTo?: Href;
  onBack?: () => void;
  right?: ReactNode;
  role?: Role;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace(backTo);
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        {back && <IconButton icon="arrow-back" label="Volver" onPress={goBack} />}
        <View style={[styles.titleWrap, !back && { paddingLeft: spacing.lg }]}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {role && role !== 'ciudadano' && (
            <View style={styles.roleChip}>
              <Text style={styles.roleText}>{roleInfo[role].label}</Text>
            </View>
          )}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.primary },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 },
  title: { color: colors.white, fontSize: font.lg, fontWeight: '700', flexShrink: 1 },
  roleChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  roleText: { color: colors.white, fontSize: font.xs, fontWeight: '700' },
  right: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.sm, gap: spacing.xs },
});
