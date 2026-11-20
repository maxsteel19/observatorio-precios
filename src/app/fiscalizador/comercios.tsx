// Fiscalizador · Seleccionar el comercio donde se capturarán precios.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Avatar, Content, EmptyState, Icon, Screen, SearchBox, SectionTitle } from '@/components/ui';
import { storeInitials, storeLabel, type Store } from '@/data/stores';
import { formatDistance, normalize } from '@/lib/format';
import { distanceFromUser } from '@/lib/search';
import { panelHref } from '@/lib/routes';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, spacing } from '@/theme';

export default function SelectStore() {
  const router = useRouter();
  const { stores } = useApp();
  const [query, setQuery] = useState('');
  const q = normalize(query);

  const list = stores
    .filter((s) => s.active)
    .map((s) => ({ store: s, distance: distanceFromUser(s) }))
    .filter(({ store }) => !q || normalize(storeLabel(store)).includes(q) || normalize(store.address).includes(q))
    .sort((a, b) => a.distance - b.distance);

  const near = list.filter((s) => s.distance < 0.5);
  const rest = list.filter((s) => s.distance >= 0.5);

  const select = (store: Store) =>
    router.push({ pathname: '/fiscalizador/captura', params: { storeId: String(store.id) } });

  const renderList = (items: typeof list) => (
    <View style={styles.list}>
      {items.map(({ store, distance }, i) => (
        <Pressable
          key={store.id}
          onPress={() => select(store)}
          style={({ pressed }) => [styles.row, i > 0 && styles.border, pressed && { backgroundColor: colors.primaryLight }]}>
          <Avatar text={storeInitials(store)} color={colors.info} bg={colors.infoLight} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{storeLabel(store)}</Text>
            <Text style={styles.meta}>{store.address}</Text>
          </View>
          <Text style={styles.distance}>{formatDistance(distance)}</Text>
          <Icon name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <Screen>
      <AppHeader title="Seleccionar comercio" role="fiscalizador" back backTo={panelHref('/fiscalizador')} />
      <Content>
        <SearchBox value={query} onChangeText={setQuery} placeholder="Buscar por nombre o dirección" />
        {list.length === 0 && <EmptyState icon="storefront-outline" title="No se encontraron comercios" />}
        {near.length > 0 && (
          <>
            <SectionTitle>Cerca de mí</SectionTitle>
            {renderList(near)}
          </>
        )}
        {rest.length > 0 && (
          <>
            <SectionTitle>Todos</SectionTitle>
            {renderList(rest)}
          </>
        )}
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: font.md, fontFamily: fonts.bold, color: colors.text },
  meta: { fontSize: font.xs, color: colors.textSecondary },
  distance: { fontSize: font.sm, color: colors.textSecondary, fontFamily: fonts.semibold },
});
