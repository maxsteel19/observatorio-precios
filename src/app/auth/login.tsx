// Acceso para fiscalizadores, comerciantes y administradores.
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Button, Content, Field, Icon, Row, Screen } from '@/components/ui';
import { panelRoute } from '@/lib/routes';
import { useApp, type StaffRole } from '@/state/AppState';
import { colors, font, radius, roleInfo, spacing } from '@/theme';

export default function Login() {
  const router = useRouter();
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

  const quick = (role: StaffRole) => loginAs(role);

  // Navega cuando la sesión ya está activa (las rutas protegidas se habilitan en ese render).
  useEffect(() => {
    if (session) router.replace(panelRoute(session.role));
  }, [session, router]);

  return (
    <Screen>
      <AppHeader title="Acceso" back />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Content contentContainerStyle={{ gap: spacing.lg }}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Icon name="pricetags" size={30} color={colors.white} />
            </View>
            <Text style={styles.title}>Observatorio de Precios</Text>
            <Text style={styles.subtitle}>Pedro Aguirre Cerda</Text>
          </View>

          {error && (
            <View style={styles.error}>
              <Icon name="warning" size={18} color={colors.danger} />
              <Text style={styles.errorText}>Correo o contraseña incorrectos</Text>
            </View>
          )}

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.cl"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Tu contraseña"
            secure
            onSubmitEditing={submit}
          />
          <Button title="Iniciar sesión" onPress={submit} loading={loading} disabled={!email || !password} />

          <Pressable onPress={() => router.push('/auth/recuperar')} style={styles.linkWrap}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.line} />
          </View>

          <Pressable onPress={() => router.push('/auth/registro')} style={styles.linkWrap}>
            <Text style={styles.muted}>¿Eres comerciante y no tienes cuenta?</Text>
            <Text style={styles.link}>Regístrate aquí</Text>
          </Pressable>

          <View style={styles.demo}>
            <Text style={styles.demoTitle}>Acceso directo demo</Text>
            <Row gap={spacing.sm}>
              {(['admin', 'fiscalizador', 'comerciante'] as const).map((role) => (
                <Pressable
                  key={role}
                  onPress={() => quick(role)}
                  style={({ pressed }) => [styles.demoBtn, { backgroundColor: roleInfo[role].bg }, pressed && { opacity: 0.7 }]}>
                  <Icon
                    name={role === 'admin' ? 'shield-checkmark' : role === 'fiscalizador' ? 'clipboard' : 'storefront'}
                    size={20}
                    color={roleInfo[role].color}
                  />
                  <Text style={[styles.demoBtnText, { color: roleInfo[role].color }]}>
                    {role === 'comerciante' ? 'Comercio' : roleInfo[role].label}
                  </Text>
                </Pressable>
              ))}
            </Row>
            <Text style={styles.demoHint}>
              También puedes usar admin@, fiscalizador@ o comercio@demo.cl con la clave demo1234.
            </Text>
          </View>
        </Content>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 4, marginTop: spacing.md },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: font.xxl - 2, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: font.md, color: colors.textSecondary },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { color: colors.danger, fontWeight: '700', fontSize: font.sm },
  linkWrap: { alignItems: 'center', gap: 2 },
  link: { color: colors.primary, fontWeight: '700', fontSize: font.md },
  muted: { color: colors.textSecondary, fontSize: font.sm },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textSecondary, fontSize: font.sm },
  demo: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  demoTitle: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  demoBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.md, borderRadius: radius.md },
  demoBtnText: { fontSize: font.xs, fontWeight: '700' },
  demoHint: { fontSize: font.xs, color: colors.textSecondary, textAlign: 'center' },
});
