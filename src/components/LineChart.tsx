// Gráfico de líneas con react-native-svg (funciona igual en Android, iOS y web, sin librerías extra).
import { useId, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { formatPrice } from '@/lib/format';
import { colors, font, spacing } from '@/theme';

export type ChartSeries = { name?: string; color: string; values: number[] };

const PAD = { top: 28, right: 14, bottom: 24, left: 52 };

export function LineChart({
  labels,
  series,
  height = 200,
  formatY = formatPrice,
}: {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  formatY?: (n: number) => string;
}) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const gradientId = `grad${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const all = series.flatMap((s) => s.values);
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const span = rawMax - rawMin || rawMax * 0.1 || 1;
  const min = rawMin - span * 0.15;
  const max = rawMax + span * 0.15;

  const n = labels.length;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * plotH;

  const ticks = [0, 1, 2, 3].map((i) => min + ((max - min) * i) / 3);
  const active = selected ?? n - 1;
  const single = series.length === 1;

  return (
    <View>
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={series[0]?.color ?? colors.primary} stopOpacity={0.25} />
                <Stop offset="1" stopColor={series[0]?.color ?? colors.primary} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {ticks.map((t, i) => (
              <Line key={i} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={colors.border} strokeDasharray="4 4" />
            ))}
            {ticks.map((t, i) => (
              <SvgText key={`t${i}`} x={PAD.left - 8} y={y(t) + 4} fontSize={10} fill={colors.textSecondary} textAnchor="end">
                {formatY(t)}
              </SvgText>
            ))}
            {labels.map((l, i) => (
              <SvgText
                key={`l${i}`}
                x={x(i)}
                y={height - 6}
                fontSize={10}
                fill={i === active ? colors.text : colors.textSecondary}
                fontWeight={i === active ? 'bold' : 'normal'}
                textAnchor="middle">
                {l}
              </SvgText>
            ))}

            <Line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} stroke={colors.border} strokeWidth={1.5} />

            {single && series[0] && (
              <Path
                d={`${series[0].values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')} L${x(n - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`}
                fill={`url(#${gradientId})`}
              />
            )}
            {series.map((s, si) => {
              const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
              return <Path key={`p${si}`} d={d} stroke={s.color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />;
            })}
            {series.map((s, si) =>
              s.values.map((v, i) => (
                <Circle
                  key={`c${si}-${i}`}
                  cx={x(i)}
                  cy={y(v)}
                  r={i === active ? 6 : 3.5}
                  fill={i === active ? colors.white : s.color}
                  stroke={s.color}
                  strokeWidth={i === active ? 3 : 0}
                />
              )),
            )}

            {single && series[0] && (
              <Tooltip x={x(active)} y={y(series[0].values[active]!)} text={formatY(series[0].values[active]!)} width={width} />
            )}

          </Svg>
        )}
        {/* Zonas táctiles por columna para inspeccionar cada punto (Pressable funciona igual en todas las plataformas). */}
        {width > 0 &&
          labels.map((l, i) => {
            const colW = n > 1 ? plotW / (n - 1) : plotW;
            return (
              <Pressable
                key={`hit${i}`}
                accessibilityLabel={`Ver valor de ${l}`}
                onPress={() => setSelected(i)}
                style={{ position: 'absolute', top: 0, bottom: 0, left: x(i) - colW / 2, width: colW }}
              />
            );
          })}
      </View>
      {!single && (
        <View style={styles.legend}>
          {series.map((s) => (
            <View key={s.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>
                {s.name} <Text style={{ fontWeight: '800', color: colors.text }}>{formatY(s.values[active]!)}</Text>
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Tooltip({ x, y, text, width }: { x: number; y: number; text: string; width: number }) {
  const w = Math.max(54, text.length * 7.5 + 12);
  const left = Math.min(Math.max(x - w / 2, 4), width - w - 4);
  return (
    <>
      <Rect x={left} y={y - 34} width={w} height={22} rx={6} fill={colors.text} />
      <SvgText x={left + w / 2} y={y - 19} fontSize={12} fontWeight="bold" fill={colors.white} textAnchor="middle">
        {text}
      </SvgText>
    </>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: font.xs, color: colors.textSecondary },
});
