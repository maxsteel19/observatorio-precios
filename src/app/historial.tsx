// Ciudadano · Historial de precio de un producto en un comercio + comparación con otros comercios.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { HeaderLoginButton } from '@/components/HeaderLoginButton';
import { LineChart } from '@/components/LineChart';
import { Badge, Card, Content, EmptyState, Icon, Row, Screen, SectionTitle, StatBox } from '@/components/ui';
import { productLabel } from '@/data/catalog';
import { storeLabel } from '@/data/stores';
import { formatDateTime, formatPercent, formatPrice, formatRelativeDay, formatShortDate } from '@/lib/format';
import { SOURCE_LABEL } from '@/lib/labels';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, spacing } from '@/theme';

export default function PriceHistory() {
  const router = useRouter();
  const { storeId, productId } = useLocalSearchParams<{ storeId: string; productId: string }>();
  const { stores, catalog, prices, priceLog } = useApp();

  const store = stores.find((s) => s.id === Number(storeId));
  const product = catalog.find((p) => p.id === productId);

  if (!store || !product) {
    return (
      <Screen>
        <AppHeader title="Historial" back />
        <EmptyState icon="stats-chart-outline" title="No hay historial para mostrar" />
      </Screen>
    );
  }

  const log = priceLog
    .filter((l) => l.storeId === store.id && l.productId === product.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-8);

  const values = log.map((l) => l.price);
  const labels = log.map((l) => (formatRelativeDay(l.date) === 'hoy' ? 'hoy' : formatShortDate(l.date)));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const change = values.length > 1 ? ((values[values.length - 1]! - values[0]!) / values[0]!) * 100 : 0;

  const others = prices
    .filter((p) => p.productId === product.id && stores.some((s) => s.id === p.storeId && s.active))
    .map((p) => ({ price: p, store: stores.find((s) => s.id === p.storeId)! }))
    .sort((a, b) => a.price.price - b.price.price);
  const maxOther = Math.max(...others.map((o) => o.price.price));

  return (
    <Screen>
      <AppHeader title="Historial de precio" back backTo={{ pathname: '/comercio/[id]', params: { id: String(store.id) } }} right={<HeaderLoginButton />} />
      <Content>
        <Card style={{ gap: spacing.md }}>
          <View>
            <Text style={styles.product}>{productLabel(product)}</Text>
            <Text style={styles.store}>{storeLabel(store)} · últimos 30 días</Text>
          </View>
          {values.length > 0 ? (
            <LineChart labels={labels} series={[{ color: colors.primary, values }]} />
          ) : (
            <Text style={styles.store}>Sin registros todavía.</Text>
          )}
          <Row gap={spacing.sm}>
            <StatBox label="Mínimo" value={formatPrice(min)} tone={colors.success} />
            <StatBox label="Promedio" value={formatPrice(avg)} />
            <StatBox label="Máximo" value={formatPrice(max)} tone={colors.danger} />
          </Row>
          <Row gap={6}>
            <Icon
              name={change <= 0 ? 'trending-down' : 'trending-up'}
              size={18}
              color={change <= 0 ? colors.success : colors.danger}
            />
            <Text style={styles.change}>
              {change <= 0 ? 'Bajó' : 'Subió'} {formatPercent(Math.abs(change))} en el período
            </Text>
          </Row>
        </Card>

        <SectionTitle>Compara en otros comercios</SectionTitle>
        <Card style={{ gap: spacing.md }}>
          {others.map(({ price, store: s }, i) => {
            const current = s.id === store.id;
            return (
              <Pressable
                key={s.id}
                disabled={current}
                onPress={() => router.replace({ pathname: '/historial', params: { storeId: String(s.id), productId: product.id } })}
                style={{ gap: 4 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={[styles.compareName, current && { color: colors.primary }]} numberOfLines={1}>
                    {i === 0 ? '🏆 ' : ''}
                    {storeLabel(s)}
                    {current ? ' (este)' : ''}
                  </Text>
                  <Text style={[styles.comparePrice, price.offer && { color: colors.accent }]}>{formatPrice(price.price)}</Text>
                </Row>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${(price.price / maxOther) * 100}%`, backgroundColor: current ? colors.primary : '#B7D9DA' },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </Card>

        <SectionTitle>Detalle de actualizaciones</SectionTitle>
        <View style={styles.list}>
          {[...log].reverse().map((l, i) => (
            <View key={l.id} style={[styles.row, i > 0 && styles.rowBorder]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.date}>{formatDateTime(l.date)}</Text>
                <Row gap={6} style={{ flexWrap: 'wrap' }}>
                  <Badge label={SOURCE_LABEL[l.source]} tone={l.source === 'ocr' ? 'ocr' : l.source === 'fiscalizador' ? 'primary' : 'neutral'} />
                  {l.offer && <Badge label="Oferta" tone="offer" />}
                </Row>
              </View>
              <Text style={styles.rowPrice}>{formatPrice(l.price)}</Text>
            </View>
          ))}
        </View>
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  product: { fontSize: font.lg, fontFamily: fonts.extrabold, color: colors.text },
  store: { fontSize: font.sm, color: colors.textSecondary },
  change: { fontSize: font.sm, color: colors.text, fontFamily: fonts.semibold },
  compareName: { fontSize: font.sm, color: colors.text, fontFamily: fonts.semibold, flex: 1 },
  comparePrice: { fontSize: font.md, fontFamily: fonts.extrabold, color: colors.text },
  barTrack: { height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4 },
  list: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  date: { fontSize: font.sm, fontFamily: fonts.semibold, color: colors.text },
  rowPrice: { fontSize: font.md, fontFamily: fonts.extrabold, color: colors.text },
});
