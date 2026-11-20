import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { panelRoute } from '@/lib/routes';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius } from '@/theme';

/** Botón "Ingresar" del encabezado del ciudadano (o "Mi panel" si ya hay sesión). */
export function HeaderLoginButton() {
  const router = useRouter();
  const { session } = useApp();

  const onPress = () => {
    if (!session) router.push('/auth/login');
    else router.push(panelRoute(session.role));
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={session ? 'Ir a mi panel' : 'Iniciar sesión'}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}>
      <Ionicons name={session ? 'grid-outline' : 'person-circle-outline'} size={18} color={colors.primary} />
      <Text style={styles.text}>{session ? 'Mi panel' : 'Ingresar'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingLeft: 9,
    paddingRight: 13,
    paddingVertical: 7,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.14)',
  },
  text: { color: colors.primary, fontSize: font.sm, fontFamily: fonts.bold },
});
