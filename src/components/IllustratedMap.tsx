// Mapa ilustrado de Pedro Aguirre Cerda.
// No necesita internet ni claves de API: ideal para la demo en la feria.
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { colors, fonts, font, radius, shadow, spacing } from '@/theme';

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
  showUser = false,
  bottomInset = 0,
  children,
}: {
  pins: MapPin[];
  onPinPress?: (id: number) => void;
  /** Si se entrega, tocar el mapa devuelve la posición en porcentaje (para ubicar una sucursal). */
  onMapPress?: (pos: { x: number; y: number }) => void;
  height?: number;
  /** Texto de la etiqueta superior; vacío para ocultarla. */
  title?: string;
  legend?: boolean;
  /** Muestra el punto azul «Estás aquí». */
  showUser?: boolean;
  /** Porcentaje inferior reservado para una tarjeta encima del mapa (los pines se ubican sobre ella). */
  bottomInset?: number;
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
        {/* Calles y parque: capa decorativa que no recibe toques. */}
        <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
          {H_STREETS.map((s, i) => (
            <View
              key={`h${i}`}
              style={[
                styles.street,
                { top: pct(s.top), left: pct(s.left), right: pct(s.right), width: pct(s.width), height: s.main ? 12 : 8 },
                s.main && styles.streetMain,
              ]}
            />
          ))}
          {V_STREETS.map((s, i) => (
            <View
              key={`v${i}`}
              style={[
                styles.street,
                { left: pct(s.left), top: pct(s.top), bottom: pct(s.bottom), height: pct(s.height), width: s.main ? 11 : 8 },
                s.main && styles.streetMain,
              ]}
            />
          ))}
          {/* Con etiqueta superior, el nombre del parque va abajo para no quedar tapado. */}
          <View
            style={[
              styles.park,
              { top: '6%', right: '4%', width: '33%', height: '21%' },
              !!title && { justifyContent: 'flex-end', paddingTop: 0, paddingBottom: 6 },
            ]}>
            <Text style={styles.parkText} numberOfLines={1}>
              Parque André Jarlán
            </Text>
          </View>
        </View>

        {/* Pines, barrios y ubicación: se acomodan sobre la tarjeta inferior si existe. */}
        <View style={[styles.layer, { bottom: `${bottomInset}%`, pointerEvents: 'box-none' }]}>
          <Text style={[styles.place, { top: '50%', left: '59%' }]}>LA VICTORIA</Text>
          <Text style={[styles.place, { top: '84%', left: '5%' }]}>LO VALLEDOR</Text>
          {showUser && (
            <View style={[styles.user, { left: '38%', top: '38%', pointerEvents: 'none' }]}>
              <View style={styles.userDot} />
            </View>
          )}
          {pins.map((p) => (
            <Pin key={p.id} pin={p} onPress={onPinPress && !onMapPress ? () => onPinPress(p.id) : undefined} />
          ))}
        </View>
      </Pressable>

      {!!title && (
        <View style={[styles.mapTitle, { pointerEvents: 'none' }]}>
          <Text style={styles.mapTitleText}>{title}</Text>
        </View>
      )}

      {legend && (
        <View style={[styles.legend, { bottom: `${bottomInset + 4}%`, pointerEvents: 'none' }]}>
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
        <View style={[styles.bubble, { backgroundColor: bg }]}>
          <Text style={styles.bubbleText}>{pin.label}</Text>
        </View>
      )}
      <View style={[styles.pin, { backgroundColor: bg }]}>
        <View style={{ transform: [{ rotate: '45deg' }] }}>
          <Ionicons name={pin.offer ? 'pricetag' : 'storefront'} size={13} color={colors.white} />
        </View>
      </View>
    </Pressable>
  );
}

const PIN = 30;

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.mapBg,
    ...shadow.card,
  },
  layer: { position: 'absolute', top: 0, left: 0, right: 0 },
  street: { position: 'absolute', backgroundColor: colors.mapStreet, borderRadius: 3 },
  streetMain: { backgroundColor: colors.mapStreetMain, borderWidth: 1, borderColor: '#F0E0B0' },
  park: {
    position: 'absolute',
    backgroundColor: colors.mapPark,
    borderRadius: 14,
    alignItems: 'center',
    paddingTop: 7,
    paddingHorizontal: 4,
  },
  parkText: { fontSize: 9.5, fontFamily: fonts.bold, color: '#3B6E22' },
  place: { position: 'absolute', fontSize: 9, letterSpacing: 1, fontFamily: fonts.extrabold, color: '#8090A6' },
  user: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    borderRadius: 15,
    backgroundColor: 'rgba(30, 155, 215, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.sky,
    borderWidth: 2.5,
    borderColor: colors.white,
    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
  },
  pinWrap: {
    position: 'absolute',
    width: 90,
    marginLeft: -45,
    marginTop: -PIN - 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pin: {
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: '-45deg' }],
    borderWidth: 2.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '-2px 3px 7px rgba(0,0,0,0.25)',
  },
  bubble: {
    position: 'absolute',
    bottom: PIN + 6,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  bubbleText: { fontSize: font.xs, fontFamily: fonts.extrabold, color: colors.white },
  mapTitle: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...shadow.card,
  },
  mapTitleText: { fontSize: font.sm, fontFamily: fonts.bold, color: colors.text },
  legend: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.md,
    gap: 4,
    ...shadow.card,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: font.xs, color: colors.text, fontFamily: fonts.semibold },
});
