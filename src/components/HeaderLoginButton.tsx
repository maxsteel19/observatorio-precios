import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { panelRoute } from '@/lib/routes';
import { useApp } from '@/state/AppState';
import { colors, font, radius } from '@/theme';

/** Botón "Iniciar sesión" del encabezado del ciudadano (o "Mi panel" si ya hay sesión). */
export function HeaderLoginButton() {
  const router = useRouter();
  const { session } = useApp();

  const onPress = () => {
    if (!session) router.push('/auth/login');
    else router.push(panelRoute(session.role));
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}>
      <Text style={styles.text}>{session ? 'Mi panel' : 'Iniciar sesión'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: { color: colors.white, fontSize: font.sm, fontWeight: '700' },
});
