// Ciudadano · Ficha del comercio: datos, cómo llegar y lista de precios registrados.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { HeaderLoginButton } from '@/components/HeaderLoginButton';
import { useToast } from '@/components/Toast';
import { Badge, Button, Card, Content, EmptyState, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { productLabel } from '@/data/catalog';
import { storeTypeLabel } from '@/data/stores';
import { formatDistance, formatPrice, formatRelativeDay } from '@/lib/format';
import { SOURCE_LABEL } from '@/lib/labels';
import { distanceFromUser } from '@/lib/search';
import { useApp } from '@/state/AppState';
import { colors, font, radius, spacing } from '@/theme';

export default function StoreDetail() {
  const router = useRouter();
  const toast = useToast();
  const { id, product: highlight } = useLocalSearchParams<{ id: string; product?: string }>();
  const { stores, prices, catalog } = useApp();

  const store = stores.find((s) => s.id === Number(id));
  if (!store) {
    return (
      <Screen>
        <AppHeader title="Ficha del comercio" back />
        <EmptyState icon="storefront-outline" title="No encontramos este comercio" />
      </Screen>
    );
  }

  const storePrices = prices
    .filter((p) => p.storeId === store.id)
    .map((p) => ({ price: p, product: catalog.find((c) => c.id === p.productId) }))
    .filter((x) => x.product?.active)
    .sort((a, b) => (a.product!.id === highlight ? -1 : b.product!.id === highlight ? 1 : a.product!.name.localeCompare(b.product!.name)));

  const openDirections = async () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
    try {
      await Linking.openURL(url);
    } catch {
      toast('No se pudo abrir el mapa', 'error');
    }
  };

  return (
    <Screen>
      <AppHeader title="Ficha del comercio" back right={<HeaderLoginButton />} />
      <Content>
        <Card style={{ gap: 6 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name}>{store.name}</Text>
              {store.branch && <Text style={styles.branch}>{store.branch}</Text>}
            </View>
            <Badge label={storeTypeLabel(store.type)} tone="primary" />
          </Row>
          <Row gap={6}>
            <Icon name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.info}>
              {store.address}, Pedro Aguirre Cerda · {formatDistance(distanceFromUser(store))}
            </Text>
          </Row>
          <Row gap={6}>
            <Icon name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.info}>{store.hours}</Text>
          </Row>
          {store.phone && (
            <Row gap={6}>
              <Icon name="call-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.info}>{store.phone}</Text>
            </Row>
          )}
        </Card>

        <Row gap={spacing.md}>
          <Button title="Cómo llegar" icon="navigate" style={{ flex: 1.5 }} onPress={openDirections} />
          <Button
            title="Reportar"
            icon="flag-outline"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/reportar', params: { storeId: String(store.id) } })}
          />
        </Row>

        <SectionTitle>Productos registrados ({storePrices.length})</SectionTitle>
        <View style={styles.list}>
          {storePrices.map(({ price, product }, i) => (
            <Pressable
              key={product!.id}
              onPress={() =>
                router.push({ pathname: '/historial', params: { storeId: String(store.id), productId: product!.id } })
              }
              style={({ pressed }) => [
                styles.row,
                i > 0 && styles.rowBorder,
                product!.id === highlight && styles.highlight,
                pressed && { opacity: 0.7 },
              ]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.product}>{productLabel(product!)}</Text>
                <Row gap={6} style={{ flexWrap: 'wrap' }}>
                  {price.offer && <Badge label="Oferta" tone="offer" icon="pricetag" />}
                  <Text style={styles.meta}>
                    {SOURCE_LABEL[price.source]} · {formatRelativeDay(price.updatedAt)}
                  </Text>
                </Row>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.price, price.offer && { color: colors.accent }]}>{formatPrice(price.price)}</Text>
                <Text style={styles.link}>Ver historial ›</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  branch: { fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' },
  info: { fontSize: font.sm, color: colors.textSecondary, flex: 1 },
  list: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  highlight: { backgroundColor: colors.primaryLight },
  product: { fontSize: font.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: font.xs, color: colors.textSecondary },
  price: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
  link: { fontSize: font.xs, color: colors.textSecondary },
});
