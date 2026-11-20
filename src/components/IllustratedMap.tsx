// Mapa ilustrado de Pedro Aguirre Cerda (como en el mockup).
// No necesita internet ni claves de API: ideal para la demo en la feria.
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { colors, font, radius, shadow, spacing } from '@/theme';

export type MapPin = {
  id: number;
  x: number;
  y: number;
  offer?: boolean;
  /** Texto en una burbuja sobre el pin (ej. el precio). */
  label?: string;
  selected?: boolean;
};

type Bar = { top?: number; left?: number; width?: number; height?: number; right?: number; bottom?: number; main?: boolean };

const H_STREETS: Bar[] = [
  { top: 22, left: 0, right: 0, main: true },
  { top: 48, left: 0, right: 0, main: true },
  { top: 68, left: 0, right: 0 },
  { top: 85, left: 5, width: 70 },
  { top: 35, left: 18, width: 50 },
  { top: 58, left: 30, width: 55 },
];

const V_STREETS: Bar[] = [
  { left: 18, top: 0, bottom: 0, main: true },
  { left: 42, top: 10, bottom: 5 },
  { left: 65, top: 0, bottom: 0, main: true },
  { left: 82, top: 15, height: 70 },
];

const pct = (n?: number) => (n == null ? undefined : (`${n}%` as const));

export function IllustratedMap({
  pins,
  onPinPress,
  onMapPress,
  height = 260,
  title = 'Pedro Aguirre Cerda',
  legend = true,
  children,
}: {
  pins: MapPin[];
  onPinPress?: (id: number) => void;
  /** Si se entrega, tocar el mapa devuelve la posición en porcentaje (para ubicar una sucursal). */
  onMapPress?: (pos: { x: number; y: number }) => void;
  height?: number;
  title?: string;
  legend?: boolean;
  children?: ReactNode;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const handlePress = (e: GestureResponderEvent) => {
    if (!onMapPress || size.w === 0) return;
    const { locationX, locationY } = e.nativeEvent;
    onMapPress({
      x: Math.max(3, Math.min(97, Math.round((locationX / size.w) * 100))),
      y: Math.max(8, Math.min(97, Math.round((locationY / size.h) * 100))),
    });
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <Pressable
        disabled={!onMapPress}
        onPress={handlePress}
        onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        style={StyleSheet.absoluteFill}>
        {/* Capa decorativa: no recibe toques para que locationX/Y sea relativo al mapa. */}
        <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
          {H_STREETS.map((s, i) => (
            <View
              key={`h${i}`}
              style={[
                styles.street,
                { top: pct(s.top), left: pct(s.left), right: pct(s.right), width: pct(s.width), height: s.main ? 14 : 9 },
                s.main && styles.streetMain,
              ]}
            />
          ))}
          {V_STREETS.map((s, i) => (
            <View
              key={`v${i}`}
              style={[
                styles.street,
                { left: pct(s.left), top: pct(s.top), bottom: pct(s.bottom), height: pct(s.height), width: s.main ? 12 : 9 },
                s.main && styles.streetMain,
              ]}
            />
          ))}
          <View style={[styles.park, { top: '8%', right: '8%', width: '28%', height: '18%' }]} />
          <View style={[styles.park, { bottom: '12%', left: '8%', width: '22%', height: '14%' }]} />
          <Text style={[styles.place, { top: '12%', right: '11%' }]}>Parque André Jarlán</Text>
          <Text style={[styles.place, { top: '27%', left: '21%' }]}>Población La Victoria</Text>
          <Text style={[styles.place, { bottom: '17%', left: '10%' }]}>Lo Valledor</Text>
        </View>

        {pins.map((p) => (
          <Pin key={p.id} pin={p} onPress={onPinPress && !onMapPress ? () => onPinPress(p.id) : undefined} />
        ))}
      </Pressable>

      <View style={[styles.mapTitle, { pointerEvents: 'none' }]}>
        <Text style={styles.mapTitleText}>{title}</Text>
      </View>

      {legend && (
        <View style={[styles.legend, { pointerEvents: 'none' }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Comercios</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.legendText}>Con ofertas</Text>
          </View>
        </View>
      )}
      {children}
    </View>
  );
}

function Pin({ pin, onPress }: { pin: MapPin; onPress?: () => void }) {
  const bg = pin.offer ? colors.accent : colors.primary;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={pin.label}
      disabled={!onPress}
      onPress={onPress}
      hitSlop={10}
      style={[
        styles.pinWrap,
        { left: `${pin.x}%`, top: `${pin.y}%`, zIndex: pin.selected ? 10 : 1 },
        !onPress && { pointerEvents: 'none' },
        pin.selected && { transform: [{ scale: 1.2 }] },
      ]}>
      {pin.label && (
        <View style={[styles.bubble, { borderColor: bg }]}>
          <Text style={[styles.bubbleText, { color: bg }]}>{pin.label}</Text>
        </View>
      )}
      <View style={[styles.pin, { backgroundColor: bg }]}>
        <Text style={styles.pinText}>$</Text>
      </View>
    </Pressable>
  );
}

const PIN = 28;

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.mapBg,
    ...shadow.card,
  },
  street: { position: 'absolute', backgroundColor: colors.mapStreet, borderRadius: 2 },
  streetMain: { backgroundColor: colors.mapStreetMain, borderWidth: 1, borderColor: '#DDE3E8' },
  park: { position: 'absolute', backgroundColor: colors.mapPark, borderRadius: 12, opacity: 0.85 },
  place: { position: 'absolute', fontSize: font.xs, fontWeight: '600', color: colors.textSecondary },
  pinWrap: {
    position: 'absolute',
    width: 80,
    marginLeft: -40,
    marginTop: -PIN - 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pin: {
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: '-45deg' }],
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  },
  pinText: { color: colors.white, fontWeight: '800', fontSize: 12, transform: [{ rotate: '45deg' }] },
  bubble: {
    position: 'absolute',
    bottom: PIN + 4,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  bubbleText: { fontSize: font.xs, fontWeight: '800' },
  mapTitle: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...shadow.card,
  },
  mapTitleText: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  legend: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    gap: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: font.xs, color: colors.text, fontWeight: '600' },
});
