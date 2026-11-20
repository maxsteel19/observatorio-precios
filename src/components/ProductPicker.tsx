import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryLabel, productLabel } from '@/data/catalog';
import { normalize } from '@/lib/format';
import { useApp } from '@/state/AppState';
import { colors, font, spacing } from '@/theme';
import { Sheet } from './Sheet';
import { EmptyState, Icon, SearchBox } from './ui';

/** Selector de productos del catálogo municipal (solo productos activos). */
export function ProductPicker({
  visible,
  onClose,
  onSelect,
  exclude = [],
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (productId: string) => void;
  exclude?: string[];
}) {
  const { catalog } = useApp();
  const [query, setQuery] = useState('');
  const q = normalize(query);
  const options = catalog.filter(
    (p) => p.active && !exclude.includes(p.id) && (!q || normalize(p.name).includes(q) || p.keywords.some((k) => k.includes(q))),
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Producto (catálogo municipal)">
      <SearchBox value={query} onChangeText={setQuery} placeholder="Buscar en el catálogo…" />
      <View>
        {options.length === 0 && <EmptyState icon="cube-outline" title="Sin coincidencias en el catálogo" />}
        {options.map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => {
              onSelect(p.id);
              setQuery('');
              onClose();
            }}
            style={({ pressed }) => [styles.row, i > 0 && styles.border, pressed && { backgroundColor: colors.primaryLight }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{productLabel(p)}</Text>
              <Text style={styles.cat}>{categoryLabel(p.category)}</Text>
            </View>
            <Icon name="add-circle-outline" size={22} color={colors.primary} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: font.md, fontWeight: '600', color: colors.text },
  cat: { fontSize: font.xs, color: colors.textSecondary },
});
