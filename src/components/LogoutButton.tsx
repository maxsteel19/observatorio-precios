import { Pressable, StyleSheet, Text } from 'react-native';

import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius } from '@/theme';
import { Icon } from './ui';

/** Cierra la sesión. Las rutas protegidas devuelven al inicio automáticamente. */
export function LogoutButton() {
  const { logout } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => void logout()}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}>
      <Icon name="log-out-outline" size={16} color={colors.white} />
      <Text style={styles.text}>Salir</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: { color: colors.white, fontSize: font.sm, fontFamily: fonts.bold },
});
