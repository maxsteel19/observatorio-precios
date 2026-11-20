// Galería de íconos para revisar el set completo (no aparece en los menús; se abre con /iconos).
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { AppIcon, ICON_NAMES } from '@/components/icons';
import { Content, Screen } from '@/components/ui';
import { colors, fonts, font, radius, spacing } from '@/theme';

export default function IconGallery() {
  return (
    <Screen>
      <AppHeader title="Íconos" back />
      <Content>
        <View style={styles.grid}>
          {ICON_NAMES.map((name) => (
            <View key={name} style={styles.cell}>
              <AppIcon name={name} size={56} />
              <View style={styles.small}>
                <AppIcon name={name} size={24} />
                <AppIcon name={name} size={24} />
              </View>
              <Text style={styles.label}>{name}</Text>
            </View>
          ))}
        </View>
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  small: { flexDirection: 'row', gap: 6 },
  label: { fontSize: font.xs, fontFamily: fonts.semibold, color: colors.textSecondary },
});
