// Administrador · Catálogo de productos de la canasta básica.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/AdminScreen';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { Badge, Button, ChipGroup, EmptyState, Field, SearchBox } from '@/components/ui';
import { CATEGORIES, UNITS, categoryLabel, type Category } from '@/data/catalog';
import { normalize } from '@/lib/format';
import { useApp } from '@/state/AppState';
import { colors, font, radius, spacing } from '@/theme';

export default function CatalogAdmin() {
  const toast = useToast();
  const { catalog, prices, addProduct, toggleProduct } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('abarrotes');
  const [unit, setUnit] = useState<string>('1 kg');
  const [brand, setBrand] = useState('');
  const [error, setError] = useState<string | null>(null);

  const q = normalize(query);
  const list = catalog.filter((p) => (category === 'all' || p.category === category) && (!q || normalize(p.name).includes(q)));

  const save = () => {
    const err = addProduct({ name, unit, category: newCategory, brand });
    if (err) return setError(err);
    toast(`Producto agregado: ${name.trim()}`, 'success');
    setOpen(false);
    setName('');
    setBrand('');
    setError(null);
  };

  return (
    <AdminScreen
      title="Catálogo de productos"
      subtitle="Productos de la canasta básica que se pueden registrar"
      actions={<Button small title="Nuevo producto" icon="add" onPress={() => setOpen(true)} />}>
      <SearchBox value={query} onChangeText={setQuery} placeholder="Buscar producto…" />
      <ChipGroup
        options={[{ value: 'all' as const, label: 'Todas' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]}
        value={category}
        onChange={setCategory}
      />
      {list.length === 0 ? (
        <EmptyState icon="cube-outline" title="Sin productos con estos filtros" />
      ) : (
        <View style={styles.list}>
          {list.map((p, i) => (
            <View key={p.id} style={[styles.row, i > 0 && styles.border, !p.active && { opacity: 0.6 }]}>
              <View style={{ flex: 1, minWidth: 160, gap: 2 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.meta}>
                  {p.unit}
                  {p.brand ? ` · ${p.brand}` : ''} · {prices.filter((x) => x.productId === p.id).length} precios vigentes
                </Text>
              </View>
              <Badge label={categoryLabel(p.category)} tone="primary" />
              <Badge label={p.active ? 'Activo' : 'Inactivo'} tone={p.active ? 'success' : 'neutral'} />
              <Button
                small
                title={p.active ? 'Desactivar' : 'Activar'}
                variant={p.active ? 'danger' : 'secondary'}
                onPress={() => toggleProduct(p.id)}
              />
            </View>
          ))}
        </View>
      )}

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Nuevo producto"
        footer={
          <>
            <Button title="Cancelar" variant="secondary" style={{ flex: 1 }} onPress={() => setOpen(false)} />
            <Button title="Guardar" style={{ flex: 1 }} onPress={save} />
          </>
        }>
        <Field label="Nombre del producto" value={name} onChangeText={setName} placeholder="Ej: Lentejas" error={error} />
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Categoría</Text>
          <ChipGroup options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} value={newCategory} onChange={setNewCategory} />
        </View>
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Unidad</Text>
          <ChipGroup options={UNITS.map((u) => ({ value: u as string, label: u }))} value={unit} onChange={setUnit} />
        </View>
        <Field label="Marca (opcional)" value={brand} onChangeText={setBrand} placeholder="Ej: Marca propia" />
      </Sheet>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: font.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: font.xs, color: colors.textSecondary },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.text },
});
