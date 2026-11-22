// Administrador · Comercios y sucursales.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/AdminScreen';
import { Badge, Button, ChipGroup, EmptyState, SearchBox } from '@/components/ui';
import { STORE_TYPES, storeLabel, storeTypeLabel, type StoreType } from '@/data/stores';
import { normalize } from '@/lib/format';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, spacing } from '@/theme';

export default function StoresAdmin() {
  const { stores, prices, toggleStore } = useApp();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<StoreType | 'all'>('all');

  const q = normalize(query);
  const list = stores.filter(
    (s) => (type === 'all' || s.type === type) && (!q || normalize(storeLabel(s)).includes(q) || normalize(s.address).includes(q)),
  );
  const usedTypes = STORE_TYPES.filter((t) => stores.some((s) => s.type === t.id));

  return (
    <AdminScreen title="Comercios y sucursales" subtitle={`${stores.filter((s) => s.active).length} activos de ${stores.length} registrados`}>
      <SearchBox value={query} onChangeText={setQuery} placeholder="Buscar comercio o dirección…" />
      <ChipGroup
        options={[{ value: 'all' as const, label: 'Todos' }, ...usedTypes.map((t) => ({ value: t.id, label: t.label }))]}
        value={type}
        onChange={setType}
      />
      {list.length === 0 ? (
        <EmptyState icon="storefront-outline" title="Sin comercios con estos filtros" />
      ) : (
        <View style={styles.list}>
          {list.map((s, i) => (
            <View key={s.id} style={[styles.row, i > 0 && styles.border, !s.active && { opacity: 0.6 }]}>
              <View style={{ flex: 1, minWidth: 180, gap: 2 }}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.meta}>
                  {s.branch ? `${s.branch} · ` : ''}
                  {s.address}
                </Text>
                <Text style={styles.meta}>
                  {prices.filter((p) => p.storeId === s.id).length} precios · {s.merchant ? 'Con cuenta de comerciante' : 'Fiscalizado por el municipio'}
                </Text>
              </View>
              <Badge label={storeTypeLabel(s.type)} tone="primary" />
              <Badge label={s.active ? 'Activo' : 'Inactivo'} tone={s.active ? 'success' : 'neutral'} />
              <Button small title={s.active ? 'Desactivar' : 'Activar'} variant={s.active ? 'danger' : 'secondary'} onPress={() => void toggleStore(s.id)} />
            </View>
          ))}
        </View>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: font.md, fontFamily: fonts.bold, color: colors.text },
  meta: { fontSize: font.xs, color: colors.textSecondary },
});
