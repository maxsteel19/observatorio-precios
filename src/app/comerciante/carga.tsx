// Comerciante · Carga masiva desde Excel/CSV (simulada con un archivo de ejemplo).
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { useToast } from '@/components/Toast';
import { Badge, Button, Card, ChipGroup, Content, Icon, Row, Screen, StatBox } from '@/components/ui';
import { normalize, formatPrice } from '@/lib/format';
import { panelHref } from '@/lib/routes';
import { useApp, useMerchantStores } from '@/state/AppState';
import { colors, fonts, font, radius, spacing } from '@/theme';

/** Contenido del archivo de ejemplo "precios_semana.csv". */
const SAMPLE_ROWS: { producto: string; precio: string }[] = [
  { producto: 'Arroz grado 1', precio: '1290' },
  { producto: 'Aceite vegetal', precio: '2390' },
  { producto: 'Leche entera', precio: '1040' },
  { producto: 'Huevos blancos', precio: '2390' },
  { producto: 'Pan marraqueta', precio: '1250' },
  { producto: 'Bebida cola 3L', precio: '2990' },
  { producto: 'Fideos spaghetti', precio: '790' },
  { producto: 'Azúcar granulada', precio: '' },
  { producto: 'Harina', precio: '950' },
  { producto: 'Tomate', precio: '-50' },
];

type Validated = { n: number; producto: string; precio: string; productId?: string; price?: number; error?: string };

type Stage = 'select' | 'processing' | 'results' | 'done';

export default function BulkUpload() {
  const router = useRouter();
  const { catalog, savePrices } = useApp();
  const myStores = useMerchantStores().filter((s) => s.active);
  const [storeId, setStoreId] = useState<number | null>(myStores[0]?.id ?? null);
  const [stage, setStage] = useState<Stage>('select');
  const [rows, setRows] = useState<Validated[]>([]);
  const [saved, setSaved] = useState(0);

  const validate = () => {
    setStage('processing');
    setTimeout(() => {
      setRows(
        SAMPLE_ROWS.map((r, i) => {
          const product = catalog.find((p) => p.active && normalize(p.name) === normalize(r.producto));
          const price = parseInt(r.precio, 10);
          const base = { n: i + 1, producto: r.producto, precio: r.precio };
          if (!product) return { ...base, error: 'No está en el catálogo' };
          if (!r.precio) return { ...base, error: 'Precio vacío' };
          if (!(price > 0)) return { ...base, error: 'Precio inválido' };
          return { ...base, productId: product.id, price };
        }),
      );
      setStage('results');
    }, 1200);
  };

  const valid = rows.filter((r) => !r.error);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    const err = await savePrices(storeId, valid.map((r) => ({ productId: r.productId!, price: r.price!, offer: false })), 'carga');
    setSaving(false);
    if (err) return toast(err, 'error');
    setSaved(valid.length);
    setStage('done');
  };

  return (
    <Screen>
      <AppHeader title="Carga masiva" role="comerciante" back backTo={panelHref('/comerciante')} />
      <Content contentContainerStyle={{ gap: spacing.lg }}>
        <Card style={styles.info}>
          <Icon name="document-text-outline" size={20} color={colors.primaryDark} />
          <Text style={styles.infoText}>
            Sube un Excel o CSV con columnas <Text style={{ fontFamily: fonts.extrabold }}>producto, precio</Text> (opcional: oferta, vigencia). Los
            productos deben existir en el catálogo municipal.
          </Text>
        </Card>

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Sucursal destino</Text>
          <ChipGroup options={myStores.map((s) => ({ value: s.id, label: s.branch ?? s.name }))} value={storeId} onChange={setStoreId} />
        </View>

        {stage === 'select' && (
          <Pressable onPress={validate} style={({ pressed }) => [styles.drop, pressed && { backgroundColor: colors.primaryLight }]}>
            <Icon name="cloud-upload-outline" size={40} color={colors.primary} />
            <Text style={styles.dropTitle}>Seleccionar archivo</Text>
            <Text style={styles.dropText}>.xlsx, .xls o .csv · Demo: usa «precios_semana.csv»</Text>
          </Pressable>
        )}

        {stage === 'processing' && (
          <View style={styles.drop}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.dropTitle}>Validando filas…</Text>
          </View>
        )}

        {stage === 'results' && (
          <>
            <Row gap={spacing.sm}>
              <StatBox label="Válidas" value={String(valid.length)} tone={colors.success} />
              <StatBox label="Con error" value={String(rows.length - valid.length)} tone={colors.danger} />
            </Row>
            <View style={styles.table}>
              <View style={[styles.tr, styles.th]}>
                <Text style={[styles.cell, { flex: 0.4 }, styles.thText]}>#</Text>
                <Text style={[styles.cell, { flex: 2 }, styles.thText]}>Producto</Text>
                <Text style={[styles.cell, { flex: 1 }, styles.thText]}>Precio</Text>
                <Text style={[styles.cell, { flex: 1.5 }, styles.thText]}>Estado</Text>
              </View>
              {rows.map((r) => (
                <View key={r.n} style={[styles.tr, r.error && { backgroundColor: '#FFF8F8' }]}>
                  <Text style={[styles.cell, { flex: 0.4, color: colors.textSecondary }]}>{r.n}</Text>
                  <Text style={[styles.cell, { flex: 2 }]}>{r.producto}</Text>
                  <Text style={[styles.cell, { flex: 1 }]}>{r.price ? formatPrice(r.price) : r.precio || '—'}</Text>
                  <View style={[styles.cell, { flex: 1.5 }]}>
                    {r.error ? <Badge label={r.error} tone="danger" /> : <Badge label="OK" tone="success" icon="checkmark" />}
                  </View>
                </View>
              ))}
            </View>
            <Button title={`Confirmar carga de ${valid.length} filas válidas`} icon="checkmark" onPress={() => void confirm()} loading={saving} disabled={!storeId || valid.length === 0} />
            <Button title="Subir otro archivo" variant="ghost" onPress={() => setStage('select')} />
          </>
        )}

        {stage === 'done' && (
          <Card style={{ alignItems: 'center', gap: spacing.sm }}>
            <Icon name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.doneCount}>{saved}</Text>
            <Text style={styles.dropText}>precios cargados y publicados</Text>
            <Row gap={spacing.sm} style={{ marginTop: spacing.sm }}>
              <Button small title="Ver historial" variant="secondary" onPress={() => router.navigate('/comerciante/historial')} />
              <Button small title="Nueva carga" onPress={() => setStage('select')} />
            </Row>
          </Card>
        )}
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  info: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.primaryLight, boxShadow: 'none' },
  infoText: { flex: 1, fontSize: font.sm, color: colors.primaryDark, lineHeight: 19 },
  label: { fontSize: font.sm, fontFamily: fonts.semibold, color: colors.text },
  drop: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  dropTitle: { fontSize: font.lg, fontFamily: fonts.extrabold, color: colors.text },
  dropText: { fontSize: font.sm, color: colors.textSecondary, textAlign: 'center' },
  table: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.sm },
  th: { backgroundColor: colors.bg, borderTopWidth: 0 },
  thText: { fontFamily: fonts.extrabold, color: colors.textSecondary, fontSize: font.xs },
  cell: { paddingVertical: spacing.sm, paddingHorizontal: 4, fontSize: font.sm, color: colors.text },
  doneCount: { fontSize: 40, fontFamily: fonts.extrabold, color: colors.primary },
});
