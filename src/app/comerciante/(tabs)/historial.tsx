// Comerciante · Historial de precios informados por el comercio.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { LogoutButton } from '@/components/LogoutButton';
import { Badge, ChipGroup, Content, EmptyState, Row, Screen } from '@/components/ui';
import { productLabel } from '@/data/catalog';
import { formatDateTime, formatPrice } from '@/lib/format';
import { useApp, useMerchantStores } from '@/state/AppState';
import { colors, font, radius, spacing } from '@/theme';

type SourceFilter = 'all' | 'comerciante' | 'carga';

export default function MerchantHistory() {
  const { priceLog, catalog } = useApp();
  const myStores = useMerchantStores();
  const [source, setSource] = useState<SourceFilter>('all');
  const [storeId, setStoreId] = useState<number | 'all'>('all');

  const entries = priceLog
    .filter((l) => myStores.some((s) => s.id === l.storeId))
    .filter((l) => l.source === 'comerciante' || l.source === 'carga')
    .filter((l) => source === 'all' || l.source === source)
    .filter((l) => storeId === 'all' || l.storeId === storeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Screen>
      <AppHeader title="Historial de precios" role="comerciante" right={<LogoutButton />} />
      <Content>
        <ChipGroup
          options={[
            { value: 'all' as SourceFilter, label: 'Todos' },
            { value: 'comerciante' as SourceFilter, label: 'Manual' },
            { value: 'carga' as SourceFilter, label: 'Carga masiva' },
          ]}
          value={source}
          onChange={setSource}
        />
        <ChipGroup
          options={[{ value: 'all' as const, label: 'Todas las sucursales' }, ...myStores.map((s) => ({ value: s.id, label: s.branch ?? s.name }))]}
          value={storeId}
          onChange={setStoreId}
        />
        {entries.length === 0 ? (
          <EmptyState icon="time-outline" title="Sin registros con estos filtros" />
        ) : (
          <View style={styles.list}>
            {entries.map((l, i) => {
              const product = catalog.find((p) => p.id === l.productId);
              const store = myStores.find((s) => s.id === l.storeId);
              return (
                <View key={l.id} style={[styles.row, i > 0 && styles.border]}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.product}>{product ? productLabel(product) : l.productId}</Text>
                    <Text style={styles.meta}>
                      {store?.branch ?? store?.name} · {formatDateTime(l.date)}
                    </Text>
                    <Row gap={6}>
                      <Badge label={l.source === 'carga' ? 'Carga masiva' : 'Manual'} tone={l.source === 'carga' ? 'ocr' : 'neutral'} />
                      {l.offer && <Badge label="Oferta" tone="offer" />}
                    </Row>
                  </View>
                  <Text style={[styles.price, l.offer && { color: colors.accent }]}>{formatPrice(l.price)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  product: { fontSize: font.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.xs, color: colors.textSecondary },
  price: { fontSize: font.lg, fontWeight: '800', color: colors.text },
});
