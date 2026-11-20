// Comerciante · Ingresar o actualizar un precio (solo productos del catálogo municipal).
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { LogoutButton } from '@/components/LogoutButton';
import { ProductPicker } from '@/components/ProductPicker';
import { useToast } from '@/components/Toast';
import { Button, Card, ChipGroup, Content, Field, Icon, Row, Screen, SwitchRow } from '@/components/ui';
import { productLabel } from '@/data/catalog';
import { formatPrice, formatRelativeDay, parsePrice } from '@/lib/format';
import { useApp, useMerchantStores } from '@/state/AppState';
import { colors, font, radius, spacing } from '@/theme';

export default function EnterPrice() {
  const toast = useToast();
  const { catalog, prices, savePrices } = useApp();
  const myStores = useMerchantStores().filter((s) => s.active);

  const [storeId, setStoreId] = useState<number | null>(myStores[0]?.id ?? null);
  const [productId, setProductId] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [offer, setOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [until, setUntil] = useState('');
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = catalog.find((p) => p.id === productId);
  const current = prices.find((p) => p.storeId === storeId && p.productId === productId);

  const save = () => {
    const normal = parsePrice(price);
    const special = parsePrice(offerPrice);
    if (!storeId || !productId) return setError('Selecciona sucursal y producto');
    if (!(normal > 0)) return setError('Ingresa un precio válido');
    if (offer && !(special > 0 && special < normal)) return setError('El precio oferta debe ser menor al precio normal');
    setError(null);
    savePrices(storeId, [{ productId, price: offer ? special : normal, offer, offerUntil: offer && until ? until : undefined }], 'comerciante');
    toast(`${product?.name} guardado: ${formatPrice(offer ? special : normal)}`, 'success');
    setProductId(null);
    setPrice('');
    setOffer(false);
    setOfferPrice('');
    setUntil('');
  };

  return (
    <Screen>
      <AppHeader title="Ingresar precio" role="comerciante" right={<LogoutButton />} />
      <Content contentContainerStyle={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Sucursal</Text>
          <ChipGroup options={myStores.map((s) => ({ value: s.id, label: s.branch ?? s.name }))} value={storeId} onChange={setStoreId} />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>Producto (catálogo municipal)</Text>
          <Pressable onPress={() => setPicker(true)} style={styles.select}>
            <Icon name="cube-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.selectText, !product && { color: '#98A2AD' }]} numberOfLines={1}>
              {product ? productLabel(product) : 'Buscar producto…'}
            </Text>
            <Icon name="chevron-down" size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.hint}>Solo puedes seleccionar productos del catálogo oficial.</Text>
        </View>

        {current && (
          <Card style={styles.current}>
            <Icon name="information-circle-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.currentText}>
              Precio publicado: <Text style={{ fontWeight: '800' }}>{formatPrice(current.price)}</Text>
              {current.offer ? ' (oferta)' : ''} · actualizado {formatRelativeDay(current.updatedAt)}
            </Text>
          </Card>
        )}

        <Field label="Precio normal ($)" value={price} onChangeText={(t) => setPrice(t.replace(/[^\d]/g, ''))} keyboardType="number-pad" placeholder="1290" />
        <SwitchRow label="Es oferta / precio especial" value={offer} onChange={setOffer} />
        {offer && (
          <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
            <Field
              label="Precio oferta ($)"
              value={offerPrice}
              onChangeText={(t) => setOfferPrice(t.replace(/[^\d]/g, ''))}
              keyboardType="number-pad"
              placeholder="990"
              style={{ flex: 1 }}
            />
            <Field label="Vigencia hasta" value={until} onChangeText={setUntil} placeholder="dd-mm-aaaa" hint="Opcional" style={{ flex: 1 }} />
          </Row>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Guardar precio" icon="checkmark" onPress={save} />
      </Content>

      <ProductPicker visible={picker} onClose={() => setPicker(false)} onSelect={setProductId} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  selectText: { flex: 1, fontSize: font.md, color: colors.text },
  hint: { fontSize: font.xs, color: colors.textSecondary },
  current: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primaryLight, padding: spacing.md, boxShadow: 'none' },
  currentText: { flex: 1, fontSize: font.sm, color: colors.primaryDark },
  error: { color: colors.danger, fontWeight: '700', fontSize: font.sm },
});
