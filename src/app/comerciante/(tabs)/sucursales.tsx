// Comerciante · Mis sucursales.
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { IllustratedMap } from '@/components/IllustratedMap';
import { LogoutButton } from '@/components/LogoutButton';
import { useToast } from '@/components/Toast';
import { Badge, Button, Card, Content, Icon, Row, Screen } from '@/components/ui';
import { useApp, useMerchantStores } from '@/state/AppState';
import { colors, fonts, font, spacing } from '@/theme';

export default function Branches() {
  const router = useRouter();
  const toast = useToast();
  const { prices, toggleStore } = useApp();
  const myStores = useMerchantStores();

  return (
    <Screen>
      <AppHeader title="Mis sucursales" role="comerciante" right={<LogoutButton />} />
      <Content>
        <IllustratedMap
          height={200}
          legend={false}
          title="Tus sucursales"
          pins={myStores.filter((s) => s.active).map((s) => ({ id: s.id, x: s.map.x, y: s.map.y, label: s.branch }))}
        />
        {myStores.map((s) => (
          <Card key={s.id} style={{ gap: spacing.sm, opacity: s.active ? 1 : 0.7 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.name}>{s.branch ?? s.name}</Text>
              <Badge label={s.active ? 'Activa' : 'Inactiva'} tone={s.active ? 'success' : 'neutral'} />
            </Row>
            <Row gap={6}>
              <Icon name="location-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.meta}>{s.address}</Text>
            </Row>
            <Row gap={6}>
              <Icon name="time-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.meta}>{s.hours}</Text>
            </Row>
            {s.phone && (
              <Row gap={6}>
                <Icon name="call-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.meta}>{s.phone}</Text>
              </Row>
            )}
            <Text style={styles.count}>{prices.filter((p) => p.storeId === s.id).length} precios publicados</Text>
            <View style={styles.actions}>
              <Button
                small
                title="Editar"
                icon="create-outline"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/comerciante/sucursal', params: { id: String(s.id) } })}
              />
              <Button
                small
                title={s.active ? 'Desactivar' : 'Activar'}
                variant={s.active ? 'danger' : 'primary'}
                style={{ flex: 1 }}
                onPress={async () => {
                  const err = await toggleStore(s.id);
                  if (err) return toast(err, 'error');
                  toast(s.active ? 'Sucursal desactivada: ya no aparece en búsquedas' : 'Sucursal activada', 'success');
                }}
              />
            </View>
          </Card>
        ))}
        <Button title="Agregar sucursal" icon="add" onPress={() => router.push('/comerciante/sucursal')} />
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: font.lg, fontFamily: fonts.extrabold, color: colors.text },
  meta: { fontSize: font.sm, color: colors.textSecondary, flex: 1 },
  count: { fontSize: font.xs, color: colors.primaryDark, fontFamily: fonts.bold },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
