// Fiscalizador · Confirmar los precios detectados por OCR o ingresarlos manualmente.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ProductPicker } from '@/components/ProductPicker';
import { useToast } from '@/components/Toast';
import { Badge, Button, Content, Icon, Row, Screen } from '@/components/ui';
import { productLabel } from '@/data/catalog';
import { OCR_SAMPLE } from '@/data/seed';
import { storeLabel } from '@/data/stores';
import { parsePrice } from '@/lib/format';
import { panelHref } from '@/lib/routes';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, spacing } from '@/theme';

type RowData = { key: string; productId: string | null; price: string; confidence?: number };

let rowKey = 0;
const nextKey = () => `row-${++rowKey}`;

function confidenceTone(c: number) {
  if (c >= 80) return { tone: 'success' as const, label: `Alta · ${c}%` };
  if (c >= 60) return { tone: 'warning' as const, label: `Media · ${c}%` };
  return { tone: 'danger' as const, label: `Baja · ${c}%` };
}

export default function ConfirmPrices() {
  const router = useRouter();
  const toast = useToast();
  const { storeId, mode = 'ocr' } = useLocalSearchParams<{ storeId: string; mode?: 'ocr' | 'manual' }>();
  const { stores, catalog, saveCapture } = useApp();
  const [saving, setSaving] = useState(false);
  const store = stores.find((s) => s.id === Number(storeId));

  const [rows, setRows] = useState<RowData[]>(() =>
    mode === 'ocr'
      ? OCR_SAMPLE.map((o) => ({ key: nextKey(), productId: o.productId, price: String(o.price), confidence: o.confidence }))
      : [{ key: nextKey(), productId: null, price: '' }],
  );
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const update = (key: string, patch: Partial<RowData>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));
  const addRow = () => {
    const key = nextKey();
    setRows((rs) => [...rs, { key, productId: null, price: '' }]);
    setPickerFor(key);
  };

  const save = async () => {
    if (!store || saving) return;
    const valid = rows.filter((r) => r.productId && parsePrice(r.price) > 0);
    if (valid.length === 0 || valid.length !== rows.length) {
      toast('Completa producto y precio en todas las filas', 'error');
      return;
    }
    const items = valid.map((r) => ({ productId: r.productId!, price: parsePrice(r.price), offer: false }));
    setSaving(true);
    // Captura y precios se guardan juntos (una transacción en la base de datos).
    const err = await saveCapture(store.id, items, mode === 'ocr' ? 'ocr' : 'manual');
    setSaving(false);
    if (err) return toast(err, 'error');
    router.replace({ pathname: '/fiscalizador/exito', params: { storeId: String(store.id), count: String(items.length) } });
  };

  return (
    <Screen>
      <AppHeader title={mode === 'ocr' ? 'Confirmar precios' : 'Ingreso manual'} role="fiscalizador" back backTo={panelHref('/fiscalizador')} />
      <Content>
        <View style={styles.storeChip}>
          <Icon name="storefront" size={16} color={colors.info} />
          <Text style={styles.storeText}>{store ? storeLabel(store) : 'Comercio'}</Text>
        </View>
        <Text style={styles.intro}>
          {mode === 'ocr' ? (
            <>
              Revisa los campos. Los de <Text style={{ fontFamily: fonts.extrabold }}>baja confianza</Text> están resaltados.
            </>
          ) : (
            'Ingresa los precios manualmente. Solo puedes elegir productos del catálogo municipal.'
          )}
        </Text>

        {rows.map((r) => {
          const product = catalog.find((p) => p.id === r.productId);
          const conf = r.confidence != null ? confidenceTone(r.confidence) : null;
          return (
            <View key={r.key} style={[styles.row, conf?.tone === 'danger' && styles.rowLow, conf?.tone === 'warning' && styles.rowMed]}>
              <Row style={{ justifyContent: 'space-between' }}>
                {conf ? <Badge label={conf.label} tone={conf.tone} icon="scan" /> : <View />}
                <Pressable accessibilityLabel="Quitar fila" onPress={() => remove(r.key)} hitSlop={8}>
                  <Icon name="trash-outline" size={18} color={colors.textSecondary} />
                </Pressable>
              </Row>
              <Pressable onPress={() => setPickerFor(r.key)} style={styles.productBtn}>
                <Text style={[styles.productText, !product && { color: colors.textSecondary }]} numberOfLines={1}>
                  {product ? productLabel(product) : 'Seleccionar producto…'}
                </Text>
                <Icon name="chevron-down" size={18} color={colors.textSecondary} />
              </Pressable>
              <View style={styles.priceWrap}>
                <Text style={styles.currency}>$</Text>
                <TextInput
                  value={r.price}
                  onChangeText={(t) => update(r.key, { price: t.replace(/[^\d]/g, ''), confidence: r.confidence != null ? 100 : undefined })}
                  keyboardType="number-pad"
                  placeholder="Precio"
                  placeholderTextColor="#98A2AD"
                  style={styles.priceInput}
                />
              </View>
            </View>
          );
        })}

        <Button title="Agregar producto" icon="add" variant="ghost" onPress={addRow} />
        <Button title="Confirmar y guardar" icon="checkmark" onPress={() => void save()} loading={saving} />
        {mode === 'ocr' && (
          <Button title="Rechazar todo (ir a manual)" variant="danger" onPress={() => setRows([{ key: nextKey(), productId: null, price: '' }])} />
        )}
      </Content>

      <ProductPicker
        visible={pickerFor != null}
        onClose={() => setPickerFor(null)}
        exclude={rows.filter((r) => r.key !== pickerFor && r.productId).map((r) => r.productId!)}
        onSelect={(productId) => pickerFor && update(pickerFor, { productId })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.infoLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  storeText: { color: colors.info, fontFamily: fonts.bold, fontSize: font.sm },
  intro: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 20 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  rowLow: { borderColor: colors.danger, backgroundColor: '#FFF8F8' },
  rowMed: { borderColor: '#F3C969' },
  productBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  productText: { fontSize: font.md, fontFamily: fonts.semibold, color: colors.text, flex: 1 },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  currency: { fontSize: font.lg, fontFamily: fonts.bold, color: colors.textSecondary },
  priceInput: { flex: 1, minHeight: 44, fontSize: font.lg, fontFamily: fonts.bold, color: colors.text, paddingHorizontal: spacing.sm },
});
