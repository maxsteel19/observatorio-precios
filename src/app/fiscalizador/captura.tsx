// Fiscalizador · Captura de la pizarra de precios (cámara y OCR simulados para la demo).
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { Icon, Screen, type IconName } from '@/components/ui';
import { OCR_SAMPLE } from '@/data/seed';
import { storeLabel } from '@/data/stores';
import { formatPrice } from '@/lib/format';
import { useApp } from '@/state/AppState';
import { colors, font, radius, spacing } from '@/theme';

const STEPS = ['Detectando la pizarra…', 'Reconociendo productos…', 'Leyendo valores…', 'Validando con el catálogo…'];

export default function Capture() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { stores, catalog } = useApp();
  const store = stores.find((s) => s.id === Number(storeId));
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!processing) return;
    if (step >= STEPS.length) {
      router.replace({ pathname: '/fiscalizador/confirmar', params: { storeId: String(storeId), mode: 'ocr' } });
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 550);
    return () => clearTimeout(t);
  }, [processing, step, router, storeId]);

  return (
    <Screen style={{ backgroundColor: '#0F1419' }}>
      <AppHeader title={store ? storeLabel(store) : 'Captura'} role="fiscalizador" back backTo="/fiscalizador/comercios" />

      <View style={styles.viewfinder}>
        <Text style={styles.hint}>Apunta a la pizarra de precios o a la boleta</Text>

        {/* Pizarra simulada: lo que "ve" la cámara */}
        <View style={styles.board}>
          <Text style={styles.boardTitle}>PRECIOS DE HOY</Text>
          {OCR_SAMPLE.map((o) => {
            const p = catalog.find((c) => c.id === o.productId);
            return (
              <View key={o.productId} style={styles.boardRow}>
                <Text style={styles.boardText}>{p?.name ?? o.productId}</Text>
                <Text style={styles.boardText}>{formatPrice(o.price)}</Text>
              </View>
            );
          })}
          {processing && <View style={[styles.scanLine, { top: `${10 + step * 22}%` }]} />}
        </View>

        {/* Esquinas del visor */}
        <View style={[styles.corner, { top: 56, left: 24, borderTopWidth: 4, borderLeftWidth: 4 }]} />
        <View style={[styles.corner, { top: 56, right: 24, borderTopWidth: 4, borderRightWidth: 4 }]} />
        <View style={[styles.corner, { bottom: 24, left: 24, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
        <View style={[styles.corner, { bottom: 24, right: 24, borderBottomWidth: 4, borderRightWidth: 4 }]} />

        <Text style={styles.demo}>Demo: el botón Capturar simula el OCR</Text>
      </View>

      <View style={[styles.controls, { paddingBottom: spacing.xl + insets.bottom }]}>
        <ControlButton
          icon="create-outline"
          label="Manual"
          onPress={() => router.replace({ pathname: '/fiscalizador/confirmar', params: { storeId: String(storeId), mode: 'manual' } })}
        />
        <Pressable accessibilityLabel="Capturar" onPress={() => setProcessing(true)} style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]}>
          <View style={styles.shutterInner} />
        </Pressable>
        <ControlButton icon="images-outline" label="Galería" onPress={() => setProcessing(true)} />
      </View>

      {processing && (
        <View style={styles.overlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingTitle}>Extrayendo precios</Text>
            <Text style={styles.processingText}>OCR multimodal en progreso</Text>
            {STEPS.map((s, i) => (
              <View key={s} style={styles.stepRow}>
                <Icon
                  name={i < step ? 'checkmark-circle' : i === step ? 'ellipse' : 'ellipse-outline'}
                  size={16}
                  color={i < step ? colors.success : i === step ? colors.primary : colors.border}
                />
                <Text style={[styles.stepText, i > step && { color: colors.textSecondary }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

function ControlButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.control, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={24} color={colors.white} />
      <Text style={styles.controlText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  viewfinder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  hint: { position: 'absolute', top: 20, color: colors.white, fontSize: font.sm, fontWeight: '600' },
  demo: { position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.6)', fontSize: font.xs },
  board: {
    width: '86%',
    maxWidth: 340,
    backgroundColor: '#2F4F3A',
    borderRadius: radius.sm,
    borderWidth: 8,
    borderColor: '#8D6E63',
    padding: spacing.lg,
    gap: 6,
    transform: [{ rotate: '-2deg' }],
    overflow: 'hidden',
  },
  boardTitle: { color: '#FFF59D', fontWeight: '800', fontSize: font.md, textAlign: 'center', marginBottom: 4, letterSpacing: 1 },
  boardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  boardText: { color: '#F5F5F5', fontSize: font.md, fontWeight: '600' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#4DD0E1', boxShadow: '0 0 12px #4DD0E1' },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: colors.white, borderRadius: 4 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.lg,
    backgroundColor: '#0F1419',
  },
  control: { alignItems: 'center', gap: 4, width: 72 },
  controlText: { color: colors.white, fontSize: font.xs, fontWeight: '600' },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.white },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,20,25,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  processingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  processingTitle: { fontSize: font.lg, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  processingText: { fontSize: font.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'stretch' },
  stepText: { fontSize: font.sm, color: colors.text, fontWeight: '600' },
});
