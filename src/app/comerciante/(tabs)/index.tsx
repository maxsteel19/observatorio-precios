// Comerciante · Panel de gestión de precios.
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { LogoutButton } from '@/components/LogoutButton';
import { Badge, Button, Card, Content, Icon, Row, Screen, SectionTitle, StatBox, type IconName } from '@/components/ui';
import { formatDateTime, formatPrice, formatRelativeDay } from '@/lib/format';
import { useApp, useMerchantStores } from '@/state/AppState';
import { colors, font, radius, spacing } from '@/theme';

const ACTIONS: { icon: IconName; label: string; href: Href }[] = [
  { icon: 'create-outline', label: 'Ingresar\nprecio', href: '/comerciante/precio' },
  { icon: 'cloud-upload-outline', label: 'Carga\nmasiva', href: '/comerciante/carga' },
  { icon: 'storefront-outline', label: 'Mis\nsucursales', href: '/comerciante/sucursales' },
];

export default function MerchantHome() {
  const router = useRouter();
  const { session, prices, priceLog, catalog } = useApp();
  const myStores = useMerchantStores();
  const myIds = new Set(myStores.map((s) => s.id));

  const myPrices = prices.filter((p) => myIds.has(p.storeId));
  const lastUpdate = myPrices.reduce<string | null>((acc, p) => (!acc || p.updatedAt > acc ? p.updatedAt : acc), null);
  const activity = priceLog
    .filter((l) => myIds.has(l.storeId) && (l.source === 'comerciante' || l.source === 'carga'))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <Screen>
      <AppHeader title="Observatorio de Precios" role="comerciante" right={<LogoutButton />} />
      <Content>
        <View>
          <Text style={styles.hello}>Hola, {session?.name} 👋</Text>
          <Text style={styles.sub}>Panel de gestión de precios</Text>
        </View>

        <Row gap={spacing.sm}>
          <StatBox label="Sucursales" value={String(myStores.length)} />
          <StatBox label="Precios activos" value={String(myPrices.length)} />
          <StatBox label="Última act." value={lastUpdate ? formatRelativeDay(lastUpdate) : '—'} />
        </Row>

        <Row gap={spacing.sm}>
          {ACTIONS.map((a) => (
            <Pressable key={a.label} onPress={() => router.push(a.href)} style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]}>
              <View style={styles.actionIcon}>
                <Icon name={a.icon} size={24} color={colors.accent} />
              </View>
              <Text style={styles.actionText}>{a.label}</Text>
            </Pressable>
          ))}
        </Row>

        <Card style={styles.tip}>
          <Icon name="flash" size={20} color={colors.primary} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <Text style={styles.tipText}>Tus precios se publican al instante en la app ciudadana.</Text>
            {myStores[0] && (
              <Button
                small
                title="Ver como ciudadano"
                variant="secondary"
                icon="eye-outline"
                style={{ alignSelf: 'flex-start' }}
                onPress={() => router.push({ pathname: '/comercio/[id]', params: { id: String(myStores[0]!.id) } })}
              />
            )}
          </View>
        </Card>

        <SectionTitle>Actividad reciente</SectionTitle>
        <View style={styles.list}>
          {activity.map((l, i) => {
            const product = catalog.find((p) => p.id === l.productId);
            const store = myStores.find((s) => s.id === l.storeId);
            return (
              <View key={l.id} style={[styles.row, i > 0 && styles.border]}>
                <View style={[styles.dot, { backgroundColor: l.source === 'carga' ? colors.info : colors.accent }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.rowText}>
                    <Text style={{ fontWeight: '700' }}>{product?.name ?? l.productId}</Text> — {formatPrice(l.price)}
                    {l.offer ? ' (oferta)' : ''} en {store?.branch ?? store?.name}
                  </Text>
                  <Row gap={6}>
                    <Text style={styles.rowMeta}>{formatDateTime(l.date)}</Text>
                    <Badge label={l.source === 'carga' ? 'Carga masiva' : 'Manual'} tone={l.source === 'carga' ? 'ocr' : 'offer'} />
                  </Row>
                </View>
              </View>
            );
          })}
        </View>
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hello: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  sub: { fontSize: font.sm, color: colors.textSecondary },
  action: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: font.sm, fontWeight: '700', color: colors.text, textAlign: 'center' },
  tip: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.primaryLight, boxShadow: 'none' },
  tipText: { fontSize: font.sm, color: colors.primaryDark, fontWeight: '600' },
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, alignItems: 'flex-start' },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  rowText: { fontSize: font.sm, color: colors.text, lineHeight: 19 },
  rowMeta: { fontSize: font.xs, color: colors.textSecondary },
});
