import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { useToast } from '@/components/Toast';
import { Button, Content, Field, Icon, Screen } from '@/components/ui';
import { colors, fonts, font, spacing } from '@/theme';

export default function RecoverPassword() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = () => {
    toast(`Te enviamos un enlace a ${email.trim()}`, 'success');
    router.replace('/auth/login');
  };

  return (
    <Screen>
      <AppHeader title="Recuperar contraseña" back backTo="/auth/login" />
      <Content contentContainerStyle={{ gap: spacing.lg }}>
        <View style={styles.hero}>
          <View style={styles.icon}>
            <Icon name="key" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Restablecer acceso</Text>
          <Text style={styles.text}>Te enviaremos un enlace a tu correo registrado.</Text>
        </View>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.cl"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Button title="Enviar enlace de recuperación" onPress={submit} disabled={!valid} />
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: font.xl, fontFamily: fonts.extrabold, color: colors.text },
  text: { fontSize: font.md, color: colors.textSecondary, textAlign: 'center' },
});
