// Fiscalizador · Inicio: resumen del día y últimas capturas.
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { LogoutButton } from '@/components/LogoutButton';
import { Badge, Button, Card, Content, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { storeLabel } from '@/data/stores';
import { daysBetween, formatDateTime } from '@/lib/format';
import { useApp } from '@/state/AppState';
import { colors, font, radius, spacing } from '@/theme';

export default function InspectorHome() {
  const router = useRouter();
  const { session, captures, stores, catalog } = useApp();

  const today = captures.filter((c) => daysBetween(c.date) === 0);
  const pricesToday = today.reduce((n, c) => n + c.productIds.length, 0);
  const storesToday = new Set(today.map((c) => c.storeId)).size;

  return (
    <Screen>
      <AppHeader title="Inicio" role="fiscalizador" right={<LogoutButton />} />
      <Content>
        <View style={styles.hero}>
          <Text style={styles.hello}>Hola, {session?.name ?? 'fiscalizador'}</Text>
          <Text style={styles.heroTitle}>Resumen de hoy</Text>
          <Row gap={spacing.md}>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>{pricesToday}</Text>
              <Text style={styles.heroLabel}>Precios capturados</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>{storesToday}</Text>
              <Text style={styles.heroLabel}>Comercios visitados</Text>
            </View>
          </Row>
        </View>

        <Row gap={spacing.md}>
          <Button title="Nueva captura" icon="camera" style={{ flex: 1 }} onPress={() => router.push('/fiscalizador/comercios')} />
          <Button title="Historial" icon="time-outline" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/fiscalizador/historial')} />
        </Row>

        <SectionTitle>Últimas capturas</SectionTitle>
        {captures.slice(0, 5).map((c) => {
          const store = stores.find((s) => s.id === c.storeId);
          return (
            <Card key={c.id} style={{ gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={spacing.sm} style={{ flex: 1 }}>
                  <Icon name={c.mode === 'ocr' ? 'scan' : 'create-outline'} size={18} color={colors.info} />
                  <Text style={styles.store} numberOfLines={1}>
                    {store ? storeLabel(store) : 'Comercio'}
                  </Text>
                </Row>
                <Text style={styles.time}>{formatDateTime(c.date)}</Text>
              </Row>
              <Text style={styles.products} numberOfLines={2}>
                {c.productIds.map((id) => catalog.find((p) => p.id === id)?.name ?? id).join(' · ')}
              </Text>
              <Row gap={6}>
                <Badge label={`${c.productIds.length} precios`} tone="primary" />
                <Badge label={c.mode === 'ocr' ? 'OCR' : 'Manual'} tone={c.mode === 'ocr' ? 'ocr' : 'neutral'} />
              </Row>
            </Card>
          );
        })}
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.info, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  hello: { color: 'rgba(255,255,255,0.85)', fontSize: font.sm, fontWeight: '600' },
  heroTitle: { color: colors.white, fontSize: font.xl, fontWeight: '800' },
  heroStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, padding: spacing.md },
  heroValue: { color: colors.white, fontSize: 32, fontWeight: '800' },
  heroLabel: { color: 'rgba(255,255,255,0.9)', fontSize: font.xs, fontWeight: '600' },
  store: { fontSize: font.md, fontWeight: '700', color: colors.text, flexShrink: 1 },
  time: { fontSize: font.xs, color: colors.textSecondary },
  products: { fontSize: font.sm, color: colors.textSecondary },
});
