// Acceso para fiscalizadores, comerciantes y administradores.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Field, Icon, IconButton, Screen } from '@/components/ui';
import { panelRoute } from '@/lib/routes';
import { useApp, type StaffRole } from '@/state/AppState';
import { colors, fonts, font, radius, roleInfo, shadow, spacing } from '@/theme';

const LOGO = require('../../../assets/images/logo-pac.png');

const DEMO: { role: StaffRole; label: string; icon: 'shield-checkmark' | 'clipboard' | 'storefront' }[] = [
  { role: 'admin', label: 'Administrador', icon: 'shield-checkmark' },
  { role: 'fiscalizador', label: 'Fiscalizador', icon: 'clipboard' },
  { role: 'comerciante', label: 'Comercio', icon: 'storefront' },
];

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, loginAs, session } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setLoading(true);
    setError(false);
    // Pequeña espera para que se note el estado de carga en la demo.
    setTimeout(() => {
      const ok = login(email, password);
      setLoading(false);
      if (!ok) setError(true);
    }, 500);
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Navega cuando la sesión ya está activa (las rutas protegidas se habilitan en ese render).
  useEffect(() => {
    if (session) router.replace(panelRoute(session.role));
  }, [session, router]);

  return (
    <Screen style={{ backgroundColor: colors.surface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom }}>
          <LinearGradient
            colors={['#1A55A0', colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
            <View style={[styles.circle, { width: 260, height: 260, right: -90, top: -100 }]} />
            <View style={[styles.circle, { width: 140, height: 140, left: -50, bottom: -40 }]} />
            <View style={styles.backRow}>
              <IconButton icon="arrow-back" label="Volver" onPress={goBack} />
            </View>
            <View style={styles.logoWrap}>
              <Image source={LOGO} style={styles.logo} contentFit="contain" accessibilityLabel="Logo de la Municipalidad de Pedro Aguirre Cerda" />
            </View>
            <Text style={styles.heroTitle}>Observatorio de Precios</Text>
            <Text style={styles.heroText}>Pedro Aguirre Cerda</Text>
          </LinearGradient>

          <View style={styles.body}>
            <View>
              <Text style={styles.title}>Ingresa a tu cuenta</Text>
              <Text style={styles.subtitle}>Para fiscalizadores municipales, comercios y administradores.</Text>
            </View>

            {error && (
              <View style={styles.error}>
                <Icon name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>El correo o la contraseña no coinciden. Revisa los datos e inténtalo de nuevo.</Text>
              </View>
            )}

            <Field
              label="Correo"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.cl"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            <Field
              label="Contraseña"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              secure
              onSubmitEditing={submit}
            />
            <Pressable onPress={() => router.push('/auth/recuperar')} style={styles.forgot} hitSlop={8}>
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            <Button title="Iniciar sesión" onPress={submit} loading={loading} disabled={!email || !password} />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.line} />
            </View>

            <Pressable onPress={() => router.push('/auth/registro')} style={styles.register}>
              <Text style={styles.muted}>¿Tienes un comercio en la comuna? </Text>
              <Text style={styles.link}>Regístralo</Text>
            </Pressable>

            <View style={styles.demo}>
              <Text style={styles.demoTitle}>Acceso rápido para la demo</Text>
              <View style={styles.demoRow}>
                {DEMO.map(({ role, label, icon }) => (
                  <Pressable
                    key={role}
                    onPress={() => loginAs(role)}
                    style={({ pressed }) => [styles.demoBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
                    <View style={[styles.demoIcon, { backgroundColor: roleInfo[role].bg }]}>
                      <Ionicons name={icon} size={20} color={roleInfo[role].color} />
                    </View>
                    <Text style={styles.demoBtnText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.demoHint}>También puedes usar admin@, fiscalizador@ o comercio@demo.cl con la clave demo1234.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingBottom: 34,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  backRow: { alignSelf: 'stretch', paddingHorizontal: spacing.xs },
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.raised,
  },
  logo: { width: 100, height: 100 },
  heroTitle: { color: colors.white, fontSize: font.xl + 2, fontFamily: fonts.extrabold, letterSpacing: -0.4, marginTop: spacing.md },
  heroText: { color: 'rgba(255,255,255,0.78)', fontSize: font.sm, fontFamily: fonts.semibold, marginTop: 2 },
  body: { padding: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
  title: { fontSize: font.xxl, fontFamily: fonts.extrabold, color: colors.text, letterSpacing: -0.6 },
  subtitle: { fontSize: font.sm + 1, color: colors.textSecondary, marginTop: 4, lineHeight: 20 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { flex: 1, color: colors.danger, fontFamily: fonts.semibold, fontSize: font.sm },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.sm },
  link: { color: colors.primary, fontFamily: fonts.bold, fontSize: font.sm + 1 },
  muted: { color: colors.textSecondary, fontSize: font.sm + 1 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textSecondary, fontSize: font.sm },
  register: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  demo: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
  },
  demoTitle: { fontSize: font.sm, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' },
  demoRow: { flexDirection: 'row', gap: spacing.sm },
  demoBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  demoIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  demoBtnText: { fontSize: font.xs + 0.5, fontFamily: fonts.bold, color: colors.text },
  demoHint: { fontSize: font.xs, color: colors.textSecondary, textAlign: 'center', lineHeight: 16 },
});
