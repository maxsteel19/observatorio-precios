import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Badge, Button, Card, Content, Icon, Row, Screen } from '@/components/ui';
import { useApp } from '@/state/AppState';
import { colors, font, spacing } from '@/theme';

export default function Pending() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { pending } = useApp();
  const request = pending.find((p) => p.id === id);
  const comercio = request?.comercio ?? '—';
  const email = request?.email ?? '—';

  return (
    <Screen>
      <AppHeader title="Solicitud enviada" />
      <Content contentContainerStyle={{ gap: spacing.lg }}>
        <View style={styles.hero}>
          <View style={styles.icon}>
            <Icon name="hourglass" size={30} color={colors.warning} />
          </View>
          <Text style={styles.title}>Cuenta en revisión</Text>
          <Text style={styles.text}>
            Tu solicitud de registro como comerciante fue recibida. Un administrador municipal la revisará antes de activar tu acceso.
          </Text>
          <Text style={styles.text}>Te notificaremos por correo cuando esté aprobada.</Text>
        </View>
        <Card style={{ gap: spacing.md }}>
          <Row style={styles.row}>
            <Text style={styles.key}>Comercio</Text>
            <Text style={styles.value}>{comercio}</Text>
          </Row>
          <Row style={styles.row}>
            <Text style={styles.key}>Email</Text>
            <Text style={styles.value}>{email}</Text>
          </Row>
          <Row style={styles.row}>
            <Text style={styles.key}>Estado</Text>
            <Badge label="En revisión" tone="warning" />
          </Row>
        </Card>
        <Text style={styles.tip}>
          Tip para la demo: entra como Administrador y abre «Cuentas» para aprobar esta solicitud.
        </Text>
        <Button title="Volver al inicio de sesión" onPress={() => router.replace('/auth/login')} />
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  text: { fontSize: font.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  row: { justifyContent: 'space-between' },
  key: { fontSize: font.sm, color: colors.textSecondary },
  value: { fontSize: font.sm, fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },
  tip: { fontSize: font.xs, color: colors.textSecondary, textAlign: 'center' },
});
