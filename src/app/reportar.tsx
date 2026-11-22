// Ciudadano · Reportar un precio incorrecto.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { useToast } from '@/components/Toast';
import { Button, Card, Content, Field, Icon, Screen, SectionTitle } from '@/components/ui';
import { storeLabel } from '@/data/stores';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, spacing } from '@/theme';

const REASONS = [
  'El precio mostrado es más alto',
  'El precio mostrado es más bajo',
  'El producto no está disponible',
  'El comercio está cerrado',
  'Otro motivo',
];

export default function Report() {
  const router = useRouter();
  const toast = useToast();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { stores, addReport } = useApp();
  const store = stores.find((s) => s.id === Number(storeId));

  const [reason, setReason] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(false);

  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!reason || !store) {
      setError(true);
      toast('Selecciona un motivo para el reporte', 'error');
      return;
    }
    if (comment.trim().length > 500) {
      toast('El comentario puede tener hasta 500 caracteres', 'error');
      return;
    }
    setSending(true);
    const err = await addReport(store.id, reason, comment.trim());
    setSending(false);
    if (err) return toast(err, 'error');
    toast('¡Gracias! Tu reporte fue enviado', 'success');
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen>
      <AppHeader title="Reportar precio" back />
      <Content>
        <Card style={styles.info}>
          <Icon name="storefront-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.store}>{store ? storeLabel(store) : 'Comercio'}</Text>
            <Text style={styles.meta}>Reportar un precio incorrecto de este comercio</Text>
          </View>
        </Card>

        <SectionTitle>Motivo del reporte *</SectionTitle>
        <View style={[styles.options, error && !reason && { borderColor: colors.danger }]}>
          {REASONS.map((r, i) => (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ checked: reason === r }}
              onPress={() => setReason(r)}
              style={[styles.option, i > 0 && styles.optionBorder]}>
              <Icon
                name={reason === r ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={reason === r ? colors.primary : colors.textSecondary}
              />
              <Text style={styles.optionText}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Field
          label="Comentario (opcional)"
          value={comment}
          onChangeText={setComment}
          placeholder="Ej: Vi el arroz a $1.290 esta mañana…"
          multiline
          numberOfLines={4}
          style={{ marginTop: spacing.sm }}
          hint="Tu reporte ayuda a mantener los datos actualizados para toda la comuna."
        />

        <Button title="Enviar reporte" icon="send" onPress={() => void submit()} loading={sending} style={{ marginTop: spacing.sm }} />
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  info: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  store: { fontSize: font.md, fontFamily: fonts.bold, color: colors.text },
  meta: { fontSize: font.sm, color: colors.textSecondary },
  options: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  optionBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  optionText: { fontSize: font.md, color: colors.text, flex: 1 },
});
