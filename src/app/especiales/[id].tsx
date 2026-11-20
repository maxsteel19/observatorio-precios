// Ciudadano · Detalle de un especial de temporada: productos, precios y emprendimientos locales.
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { AppIcon } from '@/components/icons';
import { useToast } from '@/components/Toast';
import { Badge, Button, Card, EmptyState, Row, Screen } from '@/components/ui';
import { DIDESE } from '@/data/didese';
import { SPECIALS, STATUS_LABEL, sortedOptions, specialStatus } from '@/data/specials';
import { formatPrice } from '@/lib/format';
import { openLink } from '@/lib/links';
import { SPECIALS_HREF } from '@/lib/routes';
import { colors, fonts, font, radius, spacing } from '@/theme';

export default function SpecialDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const special = SPECIALS.find((s) => s.id === id);

  if (!special) {
    return (
      <Screen>
        <AppHeader title="Especial" back backTo={SPECIALS_HREF} />
        <EmptyState icon="calendar-outline" title="No encontramos este especial" text="Vuelve a la lista de especiales de temporada." />
      </Screen>
    );
  }

  const status = specialStatus(special);
  const localStores = new Set(special.items.flatMap((i) => i.options.filter((o) => o.local).map((o) => o.store)));

  return (
    <Screen>
      <AppHeader title={special.title} back backTo={SPECIALS_HREF} />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom }}>
        <LinearGradient colors={special.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.circle} />
          <AppIcon name={special.icon} size={70} style={styles.heroEmoji} />
          <View style={[styles.status, status === 'vigente' && { backgroundColor: colors.yellow }]}>
            <Text style={[styles.statusText, status === 'vigente' && { color: colors.primaryDark }]}>
              {STATUS_LABEL[status]} · {special.period}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{special.title} en PAC</Text>
          <Text style={styles.heroText}>{special.description}</Text>
          <Row gap={spacing.lg} style={{ marginTop: spacing.sm }}>
            <View>
              <Text style={styles.statValue}>{special.items.length}</Text>
              <Text style={styles.statLabel}>productos</Text>
            </View>
            <View>
              <Text style={styles.statValue}>{localStores.size}</Text>
              <Text style={styles.statLabel}>emprendimientos locales</Text>
            </View>
          </Row>
        </LinearGradient>

        <View style={styles.list}>
          {special.items.map((item) => {
            const [best, ...rest] = sortedOptions(item);
            return (
              <Card key={item.name} style={{ gap: spacing.sm }}>
                <Row gap={spacing.md}>
                  <View style={styles.itemArt}>
                    <AppIcon name={item.icon} size={42} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemUnit}>{item.unit}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.bestPrice}>{formatPrice(best!.price)}</Text>
                    <Text style={styles.bestLabel}>Más barato</Text>
                  </View>
                </Row>
                <Row gap={6} style={{ flexWrap: 'wrap' }}>
                  <Ionicons name="storefront-outline" size={14} color={colors.primary} />
                  <Text style={styles.bestStore}>{best!.store}</Text>
                  {best!.local && <Badge label="Emprendimiento local" tone="success" icon="heart" />}
                </Row>
                {rest.length > 0 && (
                  <View style={styles.others}>
                    {rest.map((o) => (
                      <Row key={o.store} style={{ justifyContent: 'space-between' }}>
                        <Row gap={6} style={{ flex: 1 }}>
                          <Text style={styles.otherStore} numberOfLines={1}>
                            {o.store}
                          </Text>
                          {o.local && <Ionicons name="heart" size={12} color={colors.success} />}
                        </Row>
                        <Text style={styles.otherPrice}>{formatPrice(o.price)}</Text>
                      </Row>
                    ))}
                  </View>
                )}
              </Card>
            );
          })}

          <Card style={styles.cta}>
            <Text style={styles.ctaTitle}>¿Conoces otro buen dato?</Text>
            <Text style={styles.ctaText}>
              La DIDESE invita a compartir precios y emprendimientos en sus publicaciones para que la lista crezca entre todas y todos.
            </Text>
            <Button
              title="Ver publicaciones de la DIDESE"
              icon="logo-facebook"
              variant="secondary"
              onPress={async () => {
                if (!(await openLink(DIDESE.facebook))) toast('No se pudo abrir el enlace', 'error');
              }}
            />
          </Card>
          <Text style={styles.foot}>Precios y negocios de ejemplo para la demo.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { margin: spacing.lg, borderRadius: 24, padding: 20, gap: 6, overflow: 'hidden' },
  circle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -60,
    top: -70,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroEmoji: { position: 'absolute', right: 12, top: 8 },
  status: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusText: { color: colors.white, fontSize: font.xs, fontFamily: fonts.bold },
  heroTitle: { color: colors.white, fontSize: font.xxl, fontFamily: fonts.extrabold, letterSpacing: -0.6, marginTop: 4, paddingRight: 64 },
  heroText: { color: 'rgba(255,255,255,0.92)', fontSize: font.sm + 1, lineHeight: 20, fontFamily: fonts.medium },
  statValue: { color: colors.white, fontSize: font.xxl, fontFamily: fonts.extrabold },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: font.xs + 1, fontFamily: fonts.semibold },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md },
  itemArt: { width: 52, height: 52, borderRadius: 17, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: font.md + 1, fontFamily: fonts.extrabold, color: colors.text },
  itemUnit: { fontSize: font.xs + 1, color: colors.textSecondary },
  bestPrice: { fontSize: font.xl + 2, fontFamily: fonts.extrabold, color: colors.action, letterSpacing: -0.5 },
  bestLabel: { fontSize: font.xs, fontFamily: fonts.bold, color: colors.action },
  bestStore: { fontSize: font.sm, fontFamily: fonts.bold, color: colors.text },
  others: { borderTopWidth: 1, borderTopColor: '#EDF1F6', paddingTop: spacing.sm, gap: 6 },
  otherStore: { fontSize: font.sm, color: colors.textSecondary, flexShrink: 1 },
  otherPrice: { fontSize: font.sm, fontFamily: fonts.bold, color: colors.text },
  cta: { gap: spacing.sm, backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  ctaTitle: { fontSize: font.lg, fontFamily: fonts.extrabold, color: colors.primaryDark },
  ctaText: { fontSize: font.sm, color: colors.primaryDark, lineHeight: 19 },
  foot: { fontSize: font.xs, color: colors.textSecondary, textAlign: 'center' },
});
