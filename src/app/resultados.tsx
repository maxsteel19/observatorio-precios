// Ciudadano · Resultados de búsqueda (lista o mapa), con orden y filtros.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { HeaderLoginButton } from '@/components/HeaderLoginButton';
import { IllustratedMap } from '@/components/IllustratedMap';
import { Sheet } from '@/components/Sheet';
import { Badge, Button, Card, Chip, ChipGroup, Content, EmptyState, Icon, Row, Screen, SearchBox, SwitchRow } from '@/components/ui';
import { CATEGORIES, productLabel } from '@/data/catalog';
import { storeLabel } from '@/data/stores';
import { formatDistance, formatPrice, formatRelativeDay } from '@/lib/format';
import { DEFAULT_FILTERS, interpretQuery, runSearch, type SearchFilters, type SortKey } from '@/lib/search';
import { useApp } from '@/state/AppState';
import { colors, font, radius, spacing } from '@/theme';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'price', label: 'Menor precio' },
  { value: 'distance', label: 'Más cerca' },
  { value: 'updated', label: 'Actualizado' },
];

export default function Results() {
  const router = useRouter();
  const { q = '' } = useLocalSearchParams<{ q?: string }>();
  const { stores, catalog, prices } = useApp();

  const [draftQuery, setDraftQuery] = useState(q);
  const [sort, setSort] = useState<SortKey>('price');
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const interpretation = interpretQuery(q, catalog);
  const results = runSearch(interpretation, { stores, catalog, prices }, filters, sort);
  const storeCount = new Set(results.map((r) => r.store.id)).size;

  const cheapestByProduct = new Map<string, number>();
  for (const r of results) {
    const current = cheapestByProduct.get(r.product.id);
    if (current == null || r.price.price < current) cheapestByProduct.set(r.product.id, r.price.price);
  }

  const activeFilterCount =
    (filters.category !== 'all' ? 1 : 0) + (filters.maxKm != null ? 1 : 0) + (filters.onlyOffers ? 1 : 0);

  const openStore = (storeId: number, productId?: string) =>
    router.push({ pathname: '/comercio/[id]', params: { id: String(storeId), ...(productId ? { product: productId } : {}) } });

  // Pines del mapa: un pin por comercio con su precio más bajo en la búsqueda.
  const pins = [...new Set(results.map((r) => r.store.id))].map((id) => {
    const storeResults = results.filter((r) => r.store.id === id);
    const best = storeResults.reduce((a, b) => (b.price.price < a.price.price ? b : a));
    return {
      id,
      x: best.store.map.x,
      y: best.store.map.y,
      offer: storeResults.some((r) => r.price.offer),
      label: formatPrice(best.price.price),
    };
  });

  return (
    <Screen>
      <AppHeader title={q.length > 26 ? `${q.slice(0, 26)}…` : q || 'Resultados'} back right={<HeaderLoginButton />} />

      <View style={styles.top}>
        <SearchBox
          value={draftQuery}
          onChangeText={setDraftQuery}
          onSubmit={() => draftQuery.trim() && router.setParams({ q: draftQuery.trim() })}
          placeholder="Buscar otro producto…"
        />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={styles.count}>
            <Text style={{ fontWeight: '800', color: colors.text }}>{storeCount}</Text> comercios · {results.length} precios
          </Text>
          <Row gap={spacing.sm}>
            <Pressable
              onPress={() => {
                setDraftFilters(filters);
                setShowFilters(true);
              }}
              style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.7 }]}>
              <Icon name="options-outline" size={16} color={colors.primary} />
              <Text style={styles.filterText}>Filtros{activeFilterCount ? ` (${activeFilterCount})` : ''}</Text>
            </Pressable>
            <View style={styles.toggle}>
              {(['list', 'map'] as const).map((m) => (
                <Pressable key={m} onPress={() => setMode(m)} style={[styles.toggleBtn, mode === m && styles.toggleActive]}>
                  <Text style={[styles.toggleText, mode === m && { color: colors.white }]}>{m === 'list' ? 'Lista' : 'Mapa'}</Text>
                </Pressable>
              ))}
            </View>
          </Row>
        </Row>
        {mode === 'list' && (
          <Row gap={spacing.sm}>
            {SORTS.map((s) => (
              <Chip key={s.value} label={s.label} selected={sort === s.value} onPress={() => setSort(s.value)} />
            ))}
          </Row>
        )}
      </View>

      <Content contentContainerStyle={{ paddingTop: spacing.sm }}>
        {interpretation.semanticLabel && results.length > 0 && (
          <View style={styles.semantic}>
            <Row gap={6}>
              <Icon name="sparkles" size={16} color={colors.primaryDark} />
              <Text style={styles.semanticTitle}>Búsqueda semántica</Text>
            </Row>
            <Text style={styles.semanticText}>
              Interpretamos “{q}” como {interpretation.semanticLabel}. Precios capturados por OCR en terreno y validados por el
              municipio.
            </Text>
          </View>
        )}

        {results.length === 0 ? (
          <EmptyState
            icon="search"
            title="No encontramos ese producto registrado aún"
            text="Prueba con otro nombre, una búsqueda más general o quita algunos filtros. Los precios se actualizan continuamente."
          />
        ) : mode === 'map' ? (
          <IllustratedMap pins={pins} height={420} title="Solo comercios con tu búsqueda" onPinPress={(id) => openStore(id)} />
        ) : (
          results.map((r) => {
            const isCheapest = cheapestByProduct.get(r.product.id) === r.price.price;
            return (
              <Card key={`${r.store.id}-${r.product.id}`} onPress={() => openStore(r.store.id, r.product.id)}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={styles.storeName} numberOfLines={1}>
                    {storeLabel(r.store)}
                  </Text>
                  <Row gap={4}>
                    <Icon name="walk-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.distance}>{formatDistance(r.distance)}</Text>
                  </Row>
                </Row>
                <Row style={{ justifyContent: 'space-between', marginTop: spacing.sm }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.product}>{productLabel(r.product)}</Text>
                    <Row gap={6} style={{ flexWrap: 'wrap' }}>
                      {isCheapest && <Badge label="Más barato" tone="success" icon="trophy" />}
                      {r.price.offer && <Badge label="Oferta" tone="offer" icon="pricetag" />}
                      {r.price.source === 'ocr' && <Badge label="OCR validado" tone="ocr" icon="scan" />}
                    </Row>
                    <Text style={styles.meta}>Actualizado {formatRelativeDay(r.price.updatedAt)}</Text>
                  </View>
                  <Text style={[styles.price, r.price.offer && { color: colors.accent }]}>{formatPrice(r.price.price)}</Text>
                </Row>
              </Card>
            );
          })
        )}
      </Content>

      <Sheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
        footer={
          <>
            <Button title="Limpiar" variant="secondary" style={{ flex: 1 }} onPress={() => setDraftFilters(DEFAULT_FILTERS)} />
            <Button
              title="Aplicar"
              style={{ flex: 1 }}
              onPress={() => {
                setFilters(draftFilters);
                setShowFilters(false);
              }}
            />
          </>
        }>
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.filterLabel}>Categoría de producto</Text>
          <ChipGroup
            options={[{ value: 'all' as const, label: 'Todas' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]}
            value={draftFilters.category}
            onChange={(category) => setDraftFilters((f) => ({ ...f, category }))}
          />
        </View>
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.filterLabel}>Distancia máxima</Text>
          <ChipGroup
            options={[
              { value: 0.5, label: '500 m' },
              { value: 1, label: '1 km' },
              { value: 2, label: '2 km' },
              { value: null, label: 'Sin límite' },
            ]}
            value={draftFilters.maxKm}
            onChange={(maxKm) => setDraftFilters((f) => ({ ...f, maxKm }))}
          />
        </View>
        <SwitchRow
          label="Solo ofertas"
          value={draftFilters.onlyOffers}
          onChange={(onlyOffers) => setDraftFilters((f) => ({ ...f, onlyOffers }))}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md, backgroundColor: colors.bg },
  count: { fontSize: font.sm, color: colors.textSecondary },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  filterText: { fontSize: font.sm, color: colors.primary, fontWeight: '700' },
  toggle: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.pill, padding: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: font.sm, fontWeight: '700', color: colors.textSecondary },
  semantic: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(13,115,119,0.2)',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  semanticTitle: { fontSize: font.sm, fontWeight: '800', color: colors.primaryDark },
  semanticText: { fontSize: font.sm, color: colors.text, lineHeight: 19 },
  storeName: { fontSize: font.md, fontWeight: '700', color: colors.text, flex: 1 },
  distance: { fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' },
  product: { fontSize: font.sm, color: colors.textSecondary },
  meta: { fontSize: font.xs, color: colors.textSecondary },
  price: { fontSize: font.xxl - 2, fontWeight: '800', color: colors.primary },
  filterLabel: { fontSize: font.sm, fontWeight: '700', color: colors.text },
});
