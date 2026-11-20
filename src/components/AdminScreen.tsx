import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, font, spacing } from '@/theme';
import { AppHeader } from './AppHeader';
import { LogoutButton } from './LogoutButton';
import { Content, Screen } from './ui';

/** Estructura común de las pantallas del administrador (contenido centrado con ancho máximo). */
export function AdminScreen({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <Screen>
      <AppHeader title="Panel de administración" role="admin" right={<LogoutButton />} />
      <Content contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Text style={styles.breadcrumb}>Admin / {title}</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {actions}
        </View>
        {children}
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 1100, alignSelf: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xs },
  breadcrumb: { fontSize: font.xs, color: colors.textSecondary, fontFamily: fonts.semibold },
  title: { fontSize: font.xxl, fontFamily: fonts.extrabold, color: colors.text },
  subtitle: { fontSize: font.sm, color: colors.textSecondary },
});
