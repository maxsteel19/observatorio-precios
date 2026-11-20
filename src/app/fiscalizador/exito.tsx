import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Button, Card, Content, Icon, Screen } from '@/components/ui';
import { storeLabel } from '@/data/stores';
import { panelHref } from '@/lib/routes';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, spacing } from '@/theme';

export default function Saved() {
  const router = useRouter();
  const { storeId, count = '0' } = useLocalSearchParams<{ storeId: string; count?: string }>();
  const { stores } = useApp();
  const store = stores.find((s) => s.id === Number(storeId));

  return (
    <Screen>
      <AppHeader title="Guardado" role="fiscalizador" />
      <Content contentContainerStyle={{ gap: spacing.lg }}>
        <View style={styles.hero}>
          <View style={styles.icon}>
            <Icon name="checkmark" size={40} color={colors.white} />
          </View>
          <Text style={styles.title}>Precios registrados</Text>
          <Text style={styles.text}>Los datos fueron guardados y auditados correctamente. Ya son visibles para los ciudadanos.</Text>
        </View>
        <Card style={{ alignItems: 'center', gap: 4 }}>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.text}>precios en {store ? storeLabel(store) : 'el comercio'}</Text>
        </Card>
        <Button title="Nueva captura" icon="camera" onPress={() => router.replace('/fiscalizador/comercios')} />
        <Button
          title="Ver en la app ciudadana"
          icon="eye-outline"
          variant="secondary"
          onPress={() => store && router.push({ pathname: '/comercio/[id]', params: { id: String(store.id) } })}
        />
        <Button title="Volver al inicio" variant="ghost" onPress={() => router.dismissTo(panelHref('/fiscalizador'))} />
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: font.xl, fontFamily: fonts.extrabold, color: colors.text },
  text: { fontSize: font.md, color: colors.textSecondary, textAlign: 'center' },
  count: { fontSize: 40, fontFamily: fonts.extrabold, color: colors.primary },
});
