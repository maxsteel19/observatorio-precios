// Ciudadano · Inicio: búsqueda, mapa de comercios y precios más bajos del día.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { HeaderLoginButton } from '@/components/HeaderLoginButton';
import { IllustratedMap } from '@/components/IllustratedMap';
import { Badge, Card, Content, Icon, Row, Screen, SearchBox, SectionTitle } from '@/components/ui';
import { productLabel } from '@/data/catalog';
import { storeLabel } from '@/data/stores';
import { formatPrice, formatRelativeDay } from '@/lib/format';
import { SEARCH_SUGGESTIONS } from '@/lib/search';
import { useApp } from '@/state/AppState';
import { colors, font, radius, spacing } from '@/theme';

export default function CitizenHome() {
  const router = useRouter();
  const { stores, prices, catalog } = useApp();
  const [query, setQuery] = useState('');

  const search = (q: string) => {
    if (!q.trim()) return;
    router.push({ pathname: '/resultados', params: { q: q.trim() } });
  };

  const activeStores = stores.filter((s) => s.active);
  const pins = activeStores.map((s) => ({
    id: s.id,
    x: s.map.x,
    y: s.map.y,
    offer: prices.some((p) => p.storeId === s.id && p.offer),
  }));

  // Precio más bajo de hoy por producto de la canasta.
  const cheapest = catalog
    .filter((p) => p.active)
    .map((product) => {
      const options = prices.filter((pr) => pr.productId === product.id && activeStores.some((s) => s.id === pr.storeId));
      if (options.length === 0) return null;
      const best = options.reduce((a, b) => (b.price < a.price ? b : a));
      return { product, best, store: activeStores.find((s) => s.id === best.storeId)!, count: options.length };
    })
    .filter((x) => x !== null)
    .slice(0, 8);

  const offers = prices
    .filter((p) => p.offer)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)
    .map((p) => ({
      price: p,
      product: catalog.find((c) => c.id === p.productId),
      store: activeStores.find((s) => s.id === p.storeId),
    }));

  return (
    <Screen>
      <AppHeader title="Observatorio de Precios" right={<HeaderLoginButton />} />
      <View style={styles.location}>
        <Icon name="location" size={16} color={colors.primaryDark} />
        <Text style={styles.locationText}>Pedro Aguirre Cerda · cerca de ti</Text>
      </View>

      <Content>
        <SearchBox
          value={query}
          onChangeText={setQuery}
          onSubmit={() => search(query)}
          placeholder="¿Qué buscas? Ej: ingredientes para cazuela"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
          {SEARCH_SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => search(s)} style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}>
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <IllustratedMap pins={pins} onPinPress={(id) => router.push({ pathname: '/comercio/[id]', params: { id: String(id) } })} />

        <SectionTitle>Precio más bajo hoy</SectionTitle>
        <View style={styles.grid}>
          {cheapest.map(({ product, best, store, count }) => (
            <Card key={product.id} style={styles.gridItem} onPress={() => search(product.name)}>
              <Text style={styles.gridName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.gridUnit}>{product.unit}</Text>
              <Text style={[styles.gridPrice, best.offer && { color: colors.accent }]}>{formatPrice(best.price)}</Text>
              <Text style={styles.gridStore} numberOfLines={1}>
                {storeLabel(store)}
              </Text>
              <Text style={styles.gridMeta}>Comparado en {count} comercios</Text>
            </Card>
          ))}
        </View>

        <SectionTitle>Ofertas recientes</SectionTitle>
        {offers.map(({ price, product, store }) =>
          product && store ? (
            <Card
              key={`${price.storeId}-${price.productId}`}
              onPress={() =>
                router.push({ pathname: '/comercio/[id]', params: { id: String(store.id), product: product.id } })
              }>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.offerProduct}>{productLabel(product)}</Text>
                  <Text style={styles.offerStore}>{storeLabel(store)}</Text>
                  <Row gap={6}>
                    <Badge label="Oferta" tone="offer" icon="pricetag" />
                    <Text style={styles.offerMeta}>Actualizado {formatRelativeDay(price.updatedAt)}</Text>
                  </Row>
                </View>
                <Text style={styles.offerPrice}>{formatPrice(price.price)}</Text>
              </Row>
            </Card>
          ) : null,
        )}

        <Text style={styles.footer}>
          Datos de demostración · Precios registrados por fiscalizadores municipales, OCR validado y comercios adheridos.
        </Text>
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
  },
  locationText: { fontSize: font.sm, color: colors.primaryDark, fontWeight: '600' },
  suggestions: { gap: spacing.sm, paddingVertical: 2 },
  suggestion: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestionText: { fontSize: font.sm, color: colors.primaryDark, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { width: '47%', flexGrow: 1, padding: spacing.md, gap: 1 },
  gridName: { fontSize: font.md, fontWeight: '700', color: colors.text },
  gridUnit: { fontSize: font.xs, color: colors.textSecondary },
  gridPrice: { fontSize: font.xl, fontWeight: '800', color: colors.primary, marginTop: 4 },
  gridStore: { fontSize: font.xs, color: colors.text, fontWeight: '600' },
  gridMeta: { fontSize: font.xs, color: colors.textSecondary },
  offerProduct: { fontSize: font.md, fontWeight: '700', color: colors.text },
  offerStore: { fontSize: font.sm, color: colors.textSecondary },
  offerMeta: { fontSize: font.xs, color: colors.textSecondary },
  offerPrice: { fontSize: font.xl, fontWeight: '800', color: colors.accent },
  footer: { fontSize: font.xs, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, lineHeight: 16 },
});
