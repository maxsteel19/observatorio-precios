// Ciudadano · Inicio: búsqueda, mejor ahorro del día, categorías, mapa, ofertas y precios más bajos.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderLoginButton } from '@/components/HeaderLoginButton';
import { IllustratedMap } from '@/components/IllustratedMap';
import { Badge, Screen, SectionLink, SectionTitle } from '@/components/ui';
import { CATEGORIES, categoryTint, productEmoji, type Product } from '@/data/catalog';
import { cheapestStation } from '@/data/fuel';
import type { PriceEntry } from '@/data/seed';
import { STATUS_LABEL, sortedSpecials, specialStatus } from '@/data/specials';
import { storeLabel, type Store } from '@/data/stores';
import { formatPrice } from '@/lib/format';
import { SPECIALS_HREF } from '@/lib/routes';
import { SEARCH_SUGGESTIONS } from '@/lib/search';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, shadow, spacing } from '@/theme';

const LOGO = require('../../assets/images/logo-pac.png');

// Sugerencias rápidas: las dos primeras usan la búsqueda semántica (recetas).
const QUICK = [
  { label: 'Cazuela barata', q: SEARCH_SUGGESTIONS[0], smart: true },
  { label: 'Desayuno', q: 'Desayuno', smart: true },
  { label: 'Arroz', q: 'Arroz' },
  { label: 'Leche', q: 'Leche' },
  { label: 'Pan', q: 'Pan marraqueta' },
  { label: 'Pollo', q: 'Pollo' },
];

type Deal = { product: Product; best: PriceEntry; store: Store; count: number; average: number; saving: number };

export default function CitizenHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stores, prices, catalog } = useApp();
  const [query, setQuery] = useState('');

  const search = (q: string) => {
    if (!q.trim()) return router.push('/resultados');
    router.push({ pathname: '/resultados', params: { q: q.trim() } });
  };
  const openStore = (id: number, product?: string) =>
    router.push({ pathname: '/comercio/[id]', params: { id: String(id), ...(product ? { product } : {}) } });

  const activeStores = stores.filter((s) => s.active);
  const livePrices = prices.filter((p) => activeStores.some((s) => s.id === p.storeId));
  const averageOf = (productId: string) => {
    const list = livePrices.filter((p) => p.productId === productId);
    return list.reduce((sum, p) => sum + p.price, 0) / Math.max(1, list.length);
  };

  // Precio más bajo de hoy por producto y cuánto se ahorra frente al promedio del barrio.
  const deals: Deal[] = [];
  for (const product of catalog.filter((p) => p.active)) {
    const options = livePrices.filter((p) => p.productId === product.id);
    if (options.length === 0) continue;
    const best = options.reduce((a, b) => (b.price < a.price ? b : a));
    const store = activeStores.find((s) => s.id === best.storeId);
    if (!store) continue;
    const average = averageOf(product.id);
    deals.push({ product, best, store, count: options.length, average, saving: Math.round((1 - best.price / average) * 100) });
  }
  const highlight = [...deals].filter((d) => d.count >= 3).sort((a, b) => b.saving - a.saving)[0];

  const offers = livePrices
    .filter((p) => p.offer)
    .map((price) => {
      const product = catalog.find((c) => c.id === price.productId);
      const store = activeStores.find((s) => s.id === price.storeId);
      const average = averageOf(price.productId);
      return product && store ? { price, product, store, saving: Math.round((1 - price.price / average) * 100) } : null;
    })
    .filter((o) => o !== null)
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 6);

  // Comercio con más ofertas activas: se destaca sobre el mapa.
  const offerCount = new Map<number, number>();
  for (const p of livePrices) if (p.offer) offerCount.set(p.storeId, (offerCount.get(p.storeId) ?? 0) + 1);
  const topStoreId = [...offerCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topStore = activeStores.find((s) => s.id === topStoreId);

  const pins = activeStores.map((s) => ({ id: s.id, x: s.map.x, y: s.map.y, offer: offerCount.has(s.id) }));

  // Otros servicios del Observatorio Municipal de Precios.
  const specials = sortedSpecials();
  const fuelBest = cheapestStation('93');
  const tiles: { emoji: string; title: string; text: string; href: Href; tint: string }[] = [
    {
      emoji: '⛽',
      title: 'Bencinas',
      text: fuelBest ? `La 93 desde ${formatPrice(fuelBest.prices['93']!)}` : 'Precios por estación',
      href: '/bencinas',
      tint: colors.yellowLight,
    },
    {
      emoji: '💳',
      title: 'Tarjeta Vecina',
      text: `Descuentos en ${activeStores.filter((s) => s.tarjetaVecina).length} comercios`,
      href: '/tarjeta-vecina',
      tint: colors.primaryLight,
    },
    {
      emoji: specials[0]!.emoji,
      title: 'Especiales',
      text: `${specials[0]!.title}: ${STATUS_LABEL[specialStatus(specials[0]!)].toLowerCase()}`,
      href: SPECIALS_HREF,
      tint: colors.actionLight,
    },
    { emoji: '🏛️', title: 'El observatorio', text: 'Quiénes somos y contacto', href: '/acerca', tint: colors.skyLight },
  ];

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom }}>
        {/* ---------- Encabezado ---------- */}
        <LinearGradient
          colors={['#1A55A0', colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
          <View style={[styles.circle, { width: 240, height: 240, right: -80, top: -90 }]} />
          <View style={[styles.circle, { width: 120, height: 120, right: 50, top: 110, opacity: 0.6 }]} />

          <View style={styles.topRow}>
            <View style={styles.brand}>
              <View style={styles.logoWrap}>
                <Image source={LOGO} style={styles.logo} contentFit="contain" accessibilityLabel="Logo de la Municipalidad de Pedro Aguirre Cerda" />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.brandTitle}>Observatorio</Text>
                <Text style={styles.brandSub} numberOfLines={1}>
                  de Precios PAC
                </Text>
              </View>
            </View>
            <HeaderLoginButton />
          </View>

          <Text style={styles.heroTitle}>¿Qué vas a comprar hoy?</Text>
          <Text style={styles.heroText}>Compara precios en {activeStores.length} comercios de tu barrio</Text>
        </LinearGradient>

        {/* ---------- Buscador ---------- */}
        <View style={styles.search}>
          <Ionicons name="search" size={21} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => search(query)}
            placeholder="Busca arroz, leche o «cazuela»"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={styles.searchInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar y filtrar"
            onPress={() => search(query)}
            style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="options" size={20} color={colors.white} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quick}>
          {QUICK.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => search(s.q)}
              style={({ pressed }) => [styles.chip, s.smart && styles.chipSmart, pressed && { opacity: 0.75 }]}>
              {s.smart && <Ionicons name="sparkles" size={14} color={colors.accentDark} />}
              <Text style={[styles.chipText, s.smart && { color: colors.accentDark }]}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ---------- Mejor ahorro del día ---------- */}
        {highlight && (
          <View style={styles.section}>
            <LinearGradient colors={[colors.actionBright, colors.action]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
              <View style={[styles.circle, { width: 170, height: 170, right: -40, bottom: -70 }]} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.bannerKicker}>Mejor ahorro de hoy</Text>
                <Text style={styles.bannerTitle}>Ahorra en tu canasta</Text>
                <Text style={styles.bannerText}>
                  {highlight.product.name} está {highlight.saving}% bajo el promedio en {highlight.store.name}.
                </Text>
                <Pressable
                  onPress={() => router.push({ pathname: '/resultados', params: { ofertas: '1' } })}
                  style={({ pressed }) => [styles.bannerBtn, pressed && { opacity: 0.85 }]}>
                  <Text style={styles.bannerBtnText}>Ver ofertas</Text>
                  <Ionicons name="arrow-forward" size={15} color={colors.action} />
                </Pressable>
              </View>
              <View style={styles.bannerArt}>
                <Text style={styles.bannerEmoji}>{productEmoji(highlight.product)}</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ---------- Más del observatorio ---------- */}
        <View style={styles.tiles}>
          {tiles.map((t) => (
            <Pressable
              key={t.title}
              accessibilityRole="button"
              onPress={() => router.push(t.href)}
              style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.97 }] }]}>
              <View style={[styles.tileArt, { backgroundColor: t.tint }]}>
                <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
              </View>
              <View>
                <Text style={styles.tileTitle} numberOfLines={1}>
                  {t.title}
                </Text>
                <Text style={styles.tileText} numberOfLines={2}>
                  {t.text}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* ---------- Categorías ---------- */}
        <View style={styles.sectionHead}>
          <SectionTitle right={<SectionLink label="Ver todo" onPress={() => router.push('/resultados')} />}>Categorías</SectionTitle>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={c.label}
              onPress={() => router.push({ pathname: '/resultados', params: { categoria: c.id } })}
              style={({ pressed }) => [styles.category, pressed && { transform: [{ scale: 0.96 }] }]}>
              <View style={[styles.categoryTile, { backgroundColor: c.tint }]}>
                <Text style={styles.categoryEmoji}>{c.emoji}</Text>
              </View>
              <Text style={styles.categoryText}>{c.short}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ---------- Mapa ---------- */}
        <View style={styles.sectionHead}>
          <SectionTitle right={<SectionLink label="Ver mapa" onPress={() => router.push({ pathname: '/resultados', params: { vista: 'mapa' } })} />}>
            Comercios cerca de ti
          </SectionTitle>
          <View style={styles.legend}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Comercio</Text>
            <View style={[styles.legendDot, { backgroundColor: colors.accent, marginLeft: spacing.md }]} />
            <Text style={styles.legendText}>Con ofertas</Text>
            <View style={[styles.legendDot, { backgroundColor: colors.sky, marginLeft: spacing.md }]} />
            <Text style={styles.legendText}>Tú</Text>
          </View>
        </View>
        <View style={styles.section}>
          <IllustratedMap
            pins={pins}
            height={280}
            title=""
            legend={false}
            showUser
            bottomInset={topStore ? 24 : 0}
            onPinPress={(id) => openStore(id)}>
            {topStore && (
              <Pressable onPress={() => openStore(topStore.id)} style={({ pressed }) => [styles.callout, pressed && { opacity: 0.9 }]}>
                <View style={styles.calloutTile}>
                  <Ionicons name="storefront" size={18} color={colors.accentDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.calloutTitle} numberOfLines={1}>
                    {storeLabel(topStore)}
                  </Text>
                  <Text style={styles.calloutText}>{offerCount.get(topStore.id)} ofertas activas hoy</Text>
                </View>
                <View style={styles.calloutGo}>
                  <Ionicons name="chevron-forward" size={17} color={colors.primary} />
                </View>
              </Pressable>
            )}
          </IllustratedMap>
        </View>

        {/* ---------- Ofertas ---------- */}
        {offers.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <SectionTitle
                right={<SectionLink label="Ver todas" onPress={() => router.push({ pathname: '/resultados', params: { ofertas: '1' } })} />}>
                Ofertas para ti
              </SectionTitle>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offers}>
              {offers.map(({ price, product, store, saving }) => (
                <Pressable
                  key={`${price.storeId}-${price.productId}`}
                  onPress={() => openStore(store.id, product.id)}
                  style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                  <LinearGradient colors={['#1B4E92', colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.offer}>
                    <View style={{ flex: 1, gap: 4 }}>
                      {saving > 0 ? (
                        <View style={styles.offerPct}>
                          <Text style={styles.offerPctText}>−{saving}%</Text>
                        </View>
                      ) : (
                        <View style={styles.offerPct}>
                          <Text style={styles.offerPctText}>Oferta</Text>
                        </View>
                      )}
                      <Text style={styles.offerName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text style={styles.offerStore} numberOfLines={1}>
                        {store.name}
                      </Text>
                      <Text style={styles.offerPrice}>{formatPrice(price.price)}</Text>
                    </View>
                    <View style={styles.offerArt}>
                      <Text style={{ fontSize: 40 }}>{productEmoji(product)}</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* ---------- Especiales de temporada ---------- */}
        <View style={styles.sectionHead}>
          <SectionTitle right={<SectionLink label="Ver todos" onPress={() => router.push(SPECIALS_HREF)} />}>Especiales de temporada</SectionTitle>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offers}>
          {specials.map((s) => {
            const status = specialStatus(s);
            return (
              <Pressable
                key={s.id}
                onPress={() => router.push({ pathname: '/especiales/[id]', params: { id: s.id } })}
                style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
                <LinearGradient colors={s.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.special}>
                  <Text style={styles.specialEmoji}>{s.emoji}</Text>
                  <View style={[styles.specialStatus, status === 'vigente' && { backgroundColor: colors.yellow }]}>
                    <Text style={[styles.specialStatusText, status === 'vigente' && { color: colors.primaryDark }]}>
                      {STATUS_LABEL[status]}
                    </Text>
                  </View>
                  <Text style={styles.specialTitle}>{s.title}</Text>
                  <Text style={styles.specialText} numberOfLines={2}>
                    {s.summary}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ---------- Precio más bajo hoy ---------- */}
        <View style={styles.sectionHead}>
          <SectionTitle right={<SectionLink label="Ver todo" onPress={() => router.push('/resultados')} />}>Precio más bajo hoy</SectionTitle>
        </View>
        <View style={styles.grid}>
          {deals.slice(0, 8).map(({ product, best, store, count, saving }) => (
            <Pressable
              key={product.id}
              onPress={() => search(product.name)}
              style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}>
              <View style={styles.cardTop}>
                <View style={[styles.cardArt, { backgroundColor: categoryTint(product.category) }]}>
                  <Text style={{ fontSize: 24 }}>{productEmoji(product)}</Text>
                </View>
                {best.offer && <Badge label="Oferta" tone="offer" icon="pricetag" />}
              </View>
              <Text style={styles.cardName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.cardUnit}>{product.unit}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.cardPrice, best.offer && { color: colors.accent }]}>{formatPrice(best.price)}</Text>
                <View style={styles.cardGo}>
                  <Ionicons name="chevron-forward" size={16} color={colors.white} />
                </View>
              </View>
              {count > 1 && saving > 0 ? (
                <View style={styles.saving}>
                  <Ionicons name="trending-down" size={14} color={colors.success} />
                  <Text style={styles.savingText}>{saving}% bajo promedio</Text>
                </View>
              ) : (
                <Text style={styles.cardMeta}>Único precio registrado</Text>
              )}
              <View style={styles.divider} />
              <View style={styles.storeRow}>
                <Ionicons name="storefront-outline" size={14} color={colors.primary} />
                <Text style={styles.storeName} numberOfLines={1}>
                  {store.name}
                </Text>
              </View>
              <Text style={styles.cardMeta}>en {count} {count === 1 ? 'comercio' : 'comercios'}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => router.push('/acerca')} style={({ pressed }) => [styles.aboutLink, pressed && { opacity: 0.7 }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.aboutText}>Acerca del Observatorio Municipal de Precios</Text>
        </Pressable>
        <Text style={styles.footer}>
          Datos de demostración. Precios registrados por fiscalizadores municipales, lectura OCR validada y comercios adheridos.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 46, height: 46 },
  brandTitle: { color: colors.white, fontSize: font.lg, fontFamily: fonts.extrabold, letterSpacing: -0.3, lineHeight: 21 },
  brandSub: { color: 'rgba(255,255,255,0.78)', fontSize: font.sm, fontFamily: fonts.semibold },
  heroTitle: {
    color: colors.white,
    fontSize: font.display - 2,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.8,
    lineHeight: 34,
    marginTop: spacing.xl,
  },
  heroText: { color: 'rgba(255,255,255,0.82)', fontSize: font.sm + 1, fontFamily: fonts.medium, marginTop: 4 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: -30,
    marginHorizontal: spacing.lg,
    height: 60,
    paddingLeft: spacing.lg,
    paddingRight: 9,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.raised,
  },
  searchInput: { flex: 1, height: '100%', fontSize: font.md, color: colors.text, fontFamily: fonts.medium },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quick: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSmart: { backgroundColor: colors.accentLight, borderColor: '#FFD8BF' },
  chipText: { fontSize: font.sm, color: colors.primary, fontFamily: fonts.bold },

  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionHead: { paddingHorizontal: spacing.lg, marginTop: spacing.md },

  banner: { borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: spacing.md, overflow: 'hidden' },
  bannerKicker: {
    alignSelf: 'flex-start',
    color: colors.white,
    fontSize: font.xs,
    fontFamily: fonts.bold,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  bannerTitle: { color: colors.white, fontSize: font.xl + 1, fontFamily: fonts.extrabold, letterSpacing: -0.4 },
  bannerText: { color: 'rgba(255,255,255,0.92)', fontSize: font.sm, lineHeight: 18, fontFamily: fonts.medium },
  bannerBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  bannerBtnText: { color: colors.action, fontSize: font.sm, fontFamily: fonts.extrabold },
  bannerArt: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerEmoji: { fontSize: 50 },

  categories: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  category: { alignItems: 'center', gap: 6, width: 72 },
  categoryTile: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  categoryEmoji: { fontSize: 30 },
  categoryText: { fontSize: font.xs + 1, fontFamily: fonts.semibold, color: colors.text },

  legend: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: font.xs, color: colors.textSecondary, fontFamily: fonts.semibold },
  callout: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 9,
    backgroundColor: colors.surface,
    borderRadius: radius.md + 2,
    ...shadow.raised,
  },
  calloutTile: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  calloutTitle: { fontSize: font.sm, fontFamily: fonts.extrabold, color: colors.text },
  calloutText: { fontSize: font.xs + 0.5, fontFamily: fonts.semibold, color: colors.accentDark },
  calloutGo: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },

  offers: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 6 },
  offer: { width: 252, minHeight: 132, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  offerPct: { alignSelf: 'flex-start', backgroundColor: colors.yellow, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 },
  offerPctText: { color: colors.primaryDark, fontSize: font.sm, fontFamily: fonts.extrabold },
  offerName: { color: colors.white, fontSize: font.md, fontFamily: fonts.extrabold, marginTop: 2 },
  offerStore: { color: 'rgba(255,255,255,0.7)', fontSize: font.xs + 1, fontFamily: fonts.medium },
  offerPrice: { color: colors.white, fontSize: font.xl + 2, fontFamily: fonts.extrabold, letterSpacing: -0.5, marginTop: 2 },
  offerArt: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  card: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDF1F6',
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardArt: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: font.md, fontFamily: fonts.extrabold, color: colors.text, marginTop: 10, letterSpacing: -0.2 },
  cardUnit: { fontSize: font.xs + 1, color: colors.textSecondary, fontFamily: fonts.medium },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardPrice: { fontSize: font.xxl - 1, fontFamily: fonts.extrabold, color: colors.primary, letterSpacing: -0.8 },
  cardGo: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' },
  saving: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  savingText: { fontSize: font.xs + 0.5, fontFamily: fonts.bold, color: colors.success },
  divider: { height: 1, backgroundColor: '#EDF1F6', marginVertical: 10 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storeName: { flex: 1, fontSize: font.xs + 1, fontFamily: fonts.bold, color: colors.text },
  cardMeta: { fontSize: font.xs, color: colors.textSecondary, fontFamily: fonts.medium, marginTop: 2 },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  tile: {
    width: '47%',
    flexGrow: 1,
    gap: 8,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#EDF1F6',
    ...shadow.card,
  },
  tileArt: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: font.md, fontFamily: fonts.extrabold, color: colors.text },
  tileText: { fontSize: font.xs + 0.5, color: colors.textSecondary, fontFamily: fonts.medium, lineHeight: 15 },

  special: { width: 200, minHeight: 150, borderRadius: 22, padding: 16, gap: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  specialEmoji: { position: 'absolute', right: 12, top: 10, fontSize: 40 },
  specialStatus: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  specialStatusText: { color: colors.white, fontSize: font.xs, fontFamily: fonts.bold },
  specialTitle: { color: colors.white, fontSize: font.lg + 1, fontFamily: fonts.extrabold, letterSpacing: -0.3 },
  specialText: { color: 'rgba(255,255,255,0.88)', fontSize: font.xs + 1, fontFamily: fonts.medium, lineHeight: 16 },

  aboutLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.xl },
  aboutText: { fontSize: font.sm, fontFamily: fonts.bold, color: colors.primary },
  footer: {
    fontSize: font.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginHorizontal: spacing.xl,
    lineHeight: 16,
  },
});
