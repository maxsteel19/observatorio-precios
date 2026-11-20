// Administrador · Dashboard con indicadores y evolución de precios.
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/AdminScreen';
import { LineChart } from '@/components/LineChart';
import { Badge, Card, Icon, Row, SectionTitle, type IconName } from '@/components/ui';
import { CATEGORIES } from '@/data/catalog';
import { CATEGORY_INDEX, lastMonthsLabels } from '@/data/seed';
import { daysBetween, formatDateTime, formatPercent, formatPrice } from '@/lib/format';
import { useApp } from '@/state/AppState';
import { colors, font, radius, spacing } from '@/theme';

export default function Dashboard() {
  const router = useRouter();
  const { stores, prices, priceLog, catalog, pending, reports, audit } = useApp();

  const activeStores = stores.filter((s) => s.active);
  // Canasta básica: suma del precio más bajo de cada producto activo.
  const basket = catalog
    .filter((p) => p.active)
    .reduce((sum, p) => {
      const options = prices.filter((pr) => pr.productId === p.id && activeStores.some((s) => s.id === pr.storeId));
      return options.length ? sum + Math.min(...options.map((o) => o.price)) : sum;
    }, 0);
  const todayCount = priceLog.filter((l) => daysBetween(l.date) === 0).length;

  const variations = CATEGORIES.map((c) => {
    const v = CATEGORY_INDEX[c.id]!;
    return { ...c, change: ((v[v.length - 1]! - v[0]!) / v[0]!) * 100 };
  }).sort((a, b) => b.change - a.change);
  const up = variations[0]!;
  const down = variations[variations.length - 1]!;

  const kpis: { label: string; value: string; sub: string; icon: IconName; tone: string; onPress?: () => void }[] = [
    { label: 'Canasta básica (más barata)', value: formatPrice(basket), sub: `${catalog.filter((p) => p.active).length} productos`, icon: 'basket-outline', tone: colors.primary },
    { label: 'Comercios activos', value: String(activeStores.length), sub: `de ${stores.length} registrados`, icon: 'storefront-outline', tone: colors.info },
    { label: 'Precios registrados hoy', value: String(todayCount), sub: `${prices.length} precios vigentes`, icon: 'pricetags-outline', tone: colors.success },
    {
      label: 'Solicitudes pendientes',
      value: String(pending.length),
      sub: `${reports.length} reportes ciudadanos`,
      icon: 'person-add-outline',
      tone: colors.accent,
      onPress: () => router.navigate('/admin/cuentas'),
    },
  ];

  return (
    <AdminScreen title="Dashboard" subtitle="Observatorio de Precios · Pedro Aguirre Cerda">
      <View style={styles.kpis}>
        {kpis.map((k) => (
          <Pressable key={k.label} disabled={!k.onPress} onPress={k.onPress} style={({ pressed }) => [styles.kpi, pressed && { opacity: 0.8 }]}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <View style={[styles.kpiIcon, { backgroundColor: `${k.tone}1A` }]}>
                <Icon name={k.icon} size={18} color={k.tone} />
              </View>
            </Row>
            <Text style={styles.kpiValue}>{k.value}</Text>
            <Text style={styles.kpiSub}>{k.sub}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.columns}>
        <Card style={[styles.chartCard, { gap: spacing.md }]}>
          <View>
            <Text style={styles.cardTitle}>Evolución de precios por categoría</Text>
            <Text style={styles.cardSub}>Índice base 100 · últimos 6 meses</Text>
          </View>
          <LineChart
            height={240}
            labels={lastMonthsLabels(6)}
            series={CATEGORIES.map((c) => ({ name: c.label, color: c.color, values: CATEGORY_INDEX[c.id]! }))}
            formatY={(n) => n.toFixed(0)}
          />
        </Card>

        <View style={styles.side}>
          <Card style={{ gap: 4 }}>
            <Text style={styles.kpiLabel}>Mayor alza</Text>
            <Text style={styles.varName}>{up.label}</Text>
            <Row gap={4}>
              <Icon name="trending-up" size={18} color={colors.danger} />
              <Text style={[styles.varValue, { color: colors.danger }]}>{formatPercent(up.change)}</Text>
            </Row>
          </Card>
          <Card style={{ gap: 4 }}>
            <Text style={styles.kpiLabel}>Mayor baja</Text>
            <Text style={styles.varName}>{down.label}</Text>
            <Row gap={4}>
              <Icon name="trending-down" size={18} color={colors.success} />
              <Text style={[styles.varValue, { color: colors.success }]}>{formatPercent(down.change)}</Text>
            </Row>
          </Card>
        </View>
      </View>

      <SectionTitle right={<Text style={styles.link} onPress={() => router.navigate('/admin/auditoria')}>Ver auditoría ›</Text>}>
        Actividad reciente
      </SectionTitle>
      <View style={styles.list}>
        {audit.slice(0, 6).map((a, i) => (
          <View key={a.id} style={[styles.row, i > 0 && styles.border]}>
            <Badge label={a.table} tone="primary" />
            <Text style={styles.rowText} numberOfLines={2}>
              {a.detail}
            </Text>
            <Text style={styles.rowMeta}>
              {a.user} · {formatDateTime(a.date)}
            </Text>
          </View>
        ))}
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  kpi: {
    flexGrow: 1,
    flexBasis: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: { fontSize: font.xs, color: colors.textSecondary, fontWeight: '700', flexShrink: 1 },
  kpiIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  kpiSub: { fontSize: font.xs, color: colors.textSecondary },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  chartCard: { flexGrow: 3, flexBasis: 420 },
  side: { flexGrow: 1, flexBasis: 220, gap: spacing.md },
  cardTitle: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: font.xs, color: colors.textSecondary },
  varName: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  varValue: { fontSize: font.lg, fontWeight: '800' },
  link: { fontSize: font.sm, color: colors.primary, fontWeight: '700' },
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  rowText: { flex: 1, minWidth: 180, fontSize: font.sm, color: colors.text },
  rowMeta: { fontSize: font.xs, color: colors.textSecondary },
});
