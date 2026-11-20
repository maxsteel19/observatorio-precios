// Ciudadano · Precios de bencina, diésel y parafina en las estaciones de la comuna.
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { HeaderLoginButton } from '@/components/HeaderLoginButton';
import { IllustratedMap } from '@/components/IllustratedMap';
import { useToast } from '@/components/Toast';
import { Badge, Card, Chip, Content, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { FUELS, FUEL_UPDATED, STATIONS, type FuelType, type Station } from '@/data/fuel';
import { formatDistance, formatPrice, formatRelativeDay } from '@/lib/format';
import { mapsDirectionsUrl, openLink } from '@/lib/links';
import { distanceFromUser } from '@/lib/search';
import { colors, fonts, font, radius, spacing } from '@/theme';

export default function Fuel() {
  const toast = useToast();
  const [fuel, setFuel] = useState<FuelType>('93');

  const price = (s: Station) => s.prices[fuel]!;
  const stations = STATIONS.filter((s) => s.prices[fuel] != null).sort((a, b) => price(a) - price(b));
  const best = stations[0]!;
  const worst = stations[stations.length - 1]!;
  const fuelLabel = FUELS.find((f) => f.id === fuel)!.label;
  // La parafina se compra por bidón de 20 litros; la bencina, por estanque de 40.
  const liters = fuel === 'parafina' ? 20 : 40;
  const saving = (price(worst) - price(best)) * liters;

  const directions = async (s: Station) => {
    if (!(await openLink(mapsDirectionsUrl(s.lat, s.lng)))) toast('No se pudo abrir el mapa', 'error');
  };

  return (
    <Screen>
      <AppHeader title="Bencinas en PAC" back right={<HeaderLoginButton />} />
      <Content>
        <View style={{ gap: 6 }}>
          <Text style={styles.intro}>Precio por litro en las principales estaciones de servicio de la comuna.</Text>
          <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
            <Badge label={`Revisado ${formatRelativeDay(FUEL_UPDATED)}`} tone="primary" icon="time-outline" />
            <Badge label="Datos de ejemplo" tone="neutral" />
          </Row>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {FUELS.map((f) => (
            <Chip key={f.id} label={f.label} selected={fuel === f.id} onPress={() => setFuel(f.id)} />
          ))}
        </ScrollView>

        <LinearGradient colors={[colors.actionBright, colors.action]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.best}>
          <View style={styles.bestCircle} />
          <Text style={styles.bestKicker}>{fuelLabel} más barata</Text>
          <Text style={styles.bestName}>{best.name}</Text>
          <Text style={styles.bestPrice}>
            {formatPrice(price(best))}
            <Text style={styles.bestUnit}> /litro</Text>
          </Text>
          <Text style={styles.bestText}>
            {saving > 0
              ? fuel === 'parafina'
                ? `Un bidón de 20 litros sale ${formatPrice(price(best) * 20)}: ${formatPrice(saving)} menos que en la estación más cara.`
                : `Cargando 40 litros ahorras ${formatPrice(saving)} frente a la estación más cara.`
              : 'Es la única estación que informa este combustible.'}
          </Text>
          <Pressable onPress={() => directions(best)} style={({ pressed }) => [styles.bestBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="navigate" size={15} color={colors.action} />
            <Text style={styles.bestBtnText}>Cómo llegar</Text>
          </Pressable>
        </LinearGradient>

        <IllustratedMap
          height={220}
          title=""
          legend={false}
          showUser
          pins={stations.map((s) => ({ id: s.id, x: s.map.x, y: s.map.y, label: formatPrice(price(s)), offer: s.id === best.id }))}
        />

        <SectionTitle>Todas las estaciones</SectionTitle>
        {stations.map((s, i) => {
          const diff = price(s) - price(best);
          return (
            <Card key={s.id} onPress={() => directions(s)} style={styles.station}>
              <View style={[styles.rank, i === 0 && { backgroundColor: colors.action }]}>
                <Text style={[styles.rankText, i === 0 && { color: colors.white }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.stationName} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={styles.stationMeta} numberOfLines={1}>
                  {s.address} · {formatDistance(distanceFromUser(s))}
                </Text>
                <Text style={styles.others} numberOfLines={1}>
                  {FUELS.filter((f) => f.id !== fuel && s.prices[f.id] != null)
                    .map((f) => `${f.short} ${formatPrice(s.prices[f.id]!)}`)
                    .join('  ·  ')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={[styles.stationPrice, i === 0 && { color: colors.action }]}>{formatPrice(price(s))}</Text>
                <Text style={[styles.diff, i === 0 && { color: colors.action }]}>{i === 0 ? 'Más barata' : `+${formatPrice(diff)}`}</Text>
              </View>
            </Card>
          );
        })}

        <View style={styles.note}>
          <Icon name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.noteText}>
            El Observatorio Municipal de Precios revisa los valores que informan las estaciones. Confirma el precio en el surtidor antes de
            cargar.
          </Text>
        </View>
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: font.md, color: colors.textSecondary, lineHeight: 21 },
  best: { borderRadius: radius.lg + 2, padding: 18, gap: 4, overflow: 'hidden' },
  bestCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -50,
    top: -60,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bestKicker: { color: 'rgba(255,255,255,0.9)', fontSize: font.sm, fontFamily: fonts.bold },
  bestName: { color: colors.white, fontSize: font.xl, fontFamily: fonts.extrabold, letterSpacing: -0.3 },
  bestPrice: { color: colors.white, fontSize: 38, fontFamily: fonts.extrabold, letterSpacing: -1.2, marginTop: 2 },
  bestUnit: { fontSize: font.md, fontFamily: fonts.semibold, letterSpacing: 0 },
  bestText: { color: 'rgba(255,255,255,0.92)', fontSize: font.sm, lineHeight: 19, fontFamily: fonts.medium },
  bestBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: spacing.sm,
  },
  bestBtnText: { color: colors.action, fontSize: font.sm, fontFamily: fonts.extrabold },
  station: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rank: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: font.md, fontFamily: fonts.extrabold, color: colors.textSecondary },
  stationName: { fontSize: font.md, fontFamily: fonts.bold, color: colors.text },
  stationMeta: { fontSize: font.xs + 1, color: colors.textSecondary },
  others: { fontSize: font.xs, color: colors.textMuted, fontFamily: fonts.semibold, marginTop: 2 },
  stationPrice: { fontSize: font.xl, fontFamily: fonts.extrabold, color: colors.primary, letterSpacing: -0.5 },
  diff: { fontSize: font.xs, fontFamily: fonts.bold, color: colors.textSecondary },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: font.sm, color: colors.primaryDark, lineHeight: 19 },
});
