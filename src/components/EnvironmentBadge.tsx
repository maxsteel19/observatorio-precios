// Indica en qué entorno corre la app: backend Supabase (y su ambiente) o modo demo sin conexión.
import { StyleSheet, Text, View } from 'react-native';

import { APP_ENV, APP_VERSION, SUPABASE_URL } from '@/services/config';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, spacing } from '@/theme';

export function environmentLabel(mode: 'supabase' | 'demo', offline: boolean) {
  if (mode === 'supabase') return `Supabase · ${APP_ENV} · v${APP_VERSION}`;
  return offline ? `Modo demo (sin conexión) · v${APP_VERSION}` : `Modo demo (datos en memoria) · v${APP_VERSION}`;
}

export function EnvironmentBadge({ detailed = false }: { detailed?: boolean }) {
  const { mode, offline, loading } = useApp();
  const online = mode === 'supabase';
  const host = SUPABASE_URL.replace(/^https?:\/\//, '');
  return (
    <View style={[styles.badge, { backgroundColor: online ? colors.successLight : colors.warningLight }]} accessibilityRole="text">
      <View style={[styles.dot, { backgroundColor: online ? colors.success : colors.warning }]} />
      <Text style={[styles.text, { color: online ? colors.success : colors.warning }]}>
        {loading ? 'Conectando con Supabase…' : environmentLabel(mode, offline)}
        {detailed && online && host ? ` · ${host}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: font.xs, fontFamily: fonts.bold },
});
