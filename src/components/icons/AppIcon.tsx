// Componente único del set de íconos: <AppIcon name="arroz" size={40} />.
// Dibuja las capas de `definitions.ts` con los degradados de `tokens.ts` y genera ids únicos
// por instancia para que dos íconos iguales en pantalla no compartan (ni pisen) sus degradados.
import { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { ICONS, type IconName, type Layer } from './definitions';
import { GROUND, PALETTE, VIEWBOX, type PaletteKey } from './tokens';

type GradientKind = 'v' | 'r' | 'd';

/** Interpreta 'navy', 'navy/r', 'navy/d', 'navy.l', 'navy.d', '#hex' o 'none'. */
function parsePaint(value: string | undefined): { solid?: string; gradient?: { key: PaletteKey; kind: GradientKind } } {
  if (!value || value === 'none') return { solid: 'none' };
  if (value.startsWith('#')) return { solid: value };
  const [base, variant] = value.split(/[./]/) as [string, string | undefined];
  const key = base as PaletteKey;
  if (!(key in PALETTE)) return { solid: value };
  if (value.includes('.')) return { solid: variant === 'd' ? PALETTE[key][1] : PALETTE[key][0] };
  if (variant === 'r') return { gradient: { key, kind: 'r' } };
  if (variant === 'd') return { gradient: { key, kind: 'd' } };
  return { gradient: { key, kind: 'v' } };
}

// Degradados que usa cada ícono, calculados una sola vez.
const GRADIENTS = new Map<IconName, { key: PaletteKey; kind: GradientKind }[]>();
function gradientsOf(name: IconName) {
  const cached = GRADIENTS.get(name);
  if (cached) return cached;
  const found = new Map<string, { key: PaletteKey; kind: GradientKind }>();
  for (const layer of ICONS[name].layers) {
    for (const v of [layer.f, layer.s]) {
      const g = parsePaint(v).gradient;
      if (g) found.set(`${g.key}-${g.kind}`, g);
    }
  }
  const list = [...found.values()];
  GRADIENTS.set(name, list);
  return list;
}

export function AppIcon({
  name,
  size = 40,
  style,
  accessibilityLabel,
}: {
  name: IconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** Si se omite, el ícono es decorativo y se oculta a los lectores de pantalla. */
  accessibilityLabel?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const def = ICONS[name];
  const gradients = gradientsOf(name);

  const paint = (v: string | undefined) => {
    const parsed = parsePaint(v);
    if (parsed.gradient) return `url(#${uid}-${parsed.gradient.key}-${parsed.gradient.kind})`;
    return parsed.solid;
  };

  const renderLayer = (layer: Layer, i: number) => {
    const props = {
      fill: paint(layer.f),
      opacity: layer.o,
      stroke: layer.s ? paint(layer.s) : undefined,
      strokeWidth: layer.sw,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      transform: layer.rot ? `rotate(${layer.rot[0]} ${layer.rot[1]} ${layer.rot[2]})` : undefined,
    };
    switch (layer.t) {
      case 'p':
        return <Path key={i} d={layer.d} {...props} />;
      case 'r':
        return <Rect key={i} x={layer.x} y={layer.y} width={layer.w} height={layer.h} rx={layer.rx} {...props} />;
      case 'c':
        return <Circle key={i} cx={layer.cx} cy={layer.cy} r={layer.r} {...props} />;
      case 'e':
        return <Ellipse key={i} cx={layer.cx} cy={layer.cy} rx={layer.rx} ry={layer.ry} {...props} />;
    }
  };

  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      aria-hidden={!accessibilityLabel}>
      <Svg width={size} height={size} viewBox={VIEWBOX}>
        <Defs>
          {gradients.map(({ key, kind }) => {
            const [light, dark] = PALETTE[key];
            const id = `${uid}-${key}-${kind}`;
            if (kind === 'r') {
              return (
                <RadialGradient key={id} id={id} cx="35%" cy="30%" r="75%">
                  <Stop offset="0" stopColor={light} />
                  <Stop offset="1" stopColor={dark} />
                </RadialGradient>
              );
            }
            return (
              <LinearGradient key={id} id={id} x1="0" y1="0" x2={kind === 'd' ? '1' : '0'} y2="1">
                <Stop offset="0" stopColor={light} />
                <Stop offset="1" stopColor={dark} />
              </LinearGradient>
            );
          })}
        </Defs>
        {def.ground !== false && (
          <Ellipse cx={GROUND.cx} cy={GROUND.cy} rx={GROUND.rx} ry={GROUND.ry} fill={GROUND.color} opacity={GROUND.opacity} />
        )}
        {def.layers.map(renderLayer)}
      </Svg>
    </View>
  );
}

/** Ícono sobre un mosaico redondeado de color suave (categorías, servicios, beneficios). */
export function IconTile({
  name,
  size = 56,
  tint,
  radius,
  style,
}: {
  name: IconName;
  size?: number;
  tint: string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: radius ?? size * 0.32, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}>
      <AppIcon name={name} size={size * 0.78} />
    </View>
  );
}
