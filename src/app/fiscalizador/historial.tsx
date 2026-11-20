// Fiscalizador · Historial de capturas agrupado por día.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Badge, Card, ChipGroup, Content, EmptyState, Row, Screen, SectionTitle } from '@/components/ui';
import { storeLabel } from '@/data/stores';
import { daysBetween, formatRelativeDay, formatShortDate, formatTime } from '@/lib/format';
import { panelHref } from '@/lib/routes';
import { useApp } from '@/state/AppState';
import { colors, font, spacing } from '@/theme';

type Period = 'all' | 'today' | 'week' | 'month';

const PERIOD_DAYS: Record<Period, number> = { all: Infinity, today: 0, week: 6, month: 30 };

export default function InspectorHistory() {
  const { captures, stores, catalog } = useApp();
  const [period, setPeriod] = useState<Period>('all');

  const filtered = captures
    .filter((c) => daysBetween(c.date) <= PERIOD_DAYS[period])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const groups: { day: string; items: typeof filtered }[] = [];
  for (const c of filtered) {
    const rel = formatRelativeDay(c.date);
    const day = rel === 'hoy' ? 'Hoy' : rel === 'ayer' ? 'Ayer' : formatShortDate(c.date);
    const g = groups.find((x) => x.day === day);
    if (g) g.items.push(c);
    else groups.push({ day, items: [c] });
  }

  const total = filtered.reduce((n, c) => n + c.productIds.length, 0);

  return (
    <Screen>
      <AppHeader title="Historial" role="fiscalizador" back backTo={panelHref('/fiscalizador')} />
      <Content>
        <ChipGroup
          options={[
            { value: 'all' as Period, label: 'Todo' },
            { value: 'today' as Period, label: 'Hoy' },
            { value: 'week' as Period, label: '7 días' },
            { value: 'month' as Period, label: '30 días' },
          ]}
          value={period}
          onChange={setPeriod}
        />
        <Text style={styles.summary}>
          {filtered.length} capturas · {total} precios registrados
        </Text>
        {groups.length === 0 && <EmptyState icon="time-outline" title="No hay capturas en este período" />}
        {groups.map((g) => (
          <View key={g.day} style={{ gap: spacing.sm }}>
            <SectionTitle>{g.day}</SectionTitle>
            {g.items.map((c) => {
              const store = stores.find((s) => s.id === c.storeId);
              return (
                <Card key={c.id} style={{ gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={styles.store} numberOfLines={1}>
                      {store ? storeLabel(store) : 'Comercio'}
                    </Text>
                    <Text style={styles.time}>{formatTime(c.date)}</Text>
                  </Row>
                  <Text style={styles.products}>
                    {c.productIds.map((id) => catalog.find((p) => p.id === id)?.name ?? id).join(' · ')}
                  </Text>
                  <Row gap={6}>
                    <Badge label={`${c.productIds.length} precios`} tone="primary" />
                    <Badge label={c.mode === 'ocr' ? 'OCR' : 'Manual'} tone={c.mode === 'ocr' ? 'ocr' : 'neutral'} />
                  </Row>
                </Card>
              );
            })}
          </View>
        ))}
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { fontSize: font.sm, color: colors.textSecondary },
  store: { fontSize: font.md, fontWeight: '700', color: colors.text, flex: 1 },
  time: { fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' },
  products: { fontSize: font.sm, color: colors.textSecondary },
});
