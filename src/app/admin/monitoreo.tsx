// Administrador · Monitoreo: entorno en ejecución y registro de actividad de la app (tabla eventos_app).
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/AdminScreen';
import { EnvironmentBadge } from '@/components/EnvironmentBadge';
import { Badge, Button, ChipGroup, EmptyState, Row, StatBox } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { APP_ENV, APP_VERSION, PLATFORM, SUPABASE_URL } from '@/services/config';
import { errorMessage } from '@/services/logger';
import { loadAppEvents, type AppEvent } from '@/services/repository';
import { supabase } from '@/services/supabase';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, spacing } from '@/theme';

const LEVEL_TONE = { info: 'success', warn: 'warning', error: 'danger' } as const;

export default function Monitoring() {
  const { mode } = useApp();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [level, setLevel] = useState<AppEvent['level'] | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || mode !== 'supabase') return;
    setLoading(true);
    setError(null);
    try {
      setEvents(await loadAppEvents(supabase));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [mode]);

  // Carga inicial: el estado se actualiza solo cuando llega la respuesta.
  useEffect(() => {
    if (!supabase || mode !== 'supabase') return;
    let cancelled = false;
    loadAppEvents(supabase)
      .then((list) => !cancelled && setEvents(list))
      .catch((e: unknown) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const list = events.filter((e) => level === 'all' || e.level === level);
  const timed = events.filter((e) => e.durationMs != null);
  const avg = timed.length ? Math.round(timed.reduce((s, e) => s + (e.durationMs ?? 0), 0) / timed.length) : 0;
  const sorted = timed.map((e) => e.durationMs ?? 0).sort((a, b) => a - b);
  const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]! : 0;

  return (
    <AdminScreen
      title="Monitoreo"
      subtitle="Entorno y registro de actividad"
      actions={<Button small title="Actualizar" icon="refresh" onPress={() => void load()} loading={loading} />}>
      <View style={styles.env}>
        <EnvironmentBadge detailed />
        <Text style={styles.envText}>
          Ambiente: {APP_ENV} · Versión {APP_VERSION} · Plataforma {PLATFORM}
          {SUPABASE_URL ? ` · Backend ${SUPABASE_URL.replace(/^https?:\/\//, '')}` : ''}
        </Text>
      </View>

      {mode !== 'supabase' ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Sin backend"
          text="En modo demo los eventos solo se muestran en la consola. Configura Supabase en .env.local para registrarlos."
        />
      ) : (
        <>
          <Row gap={spacing.md} style={{ flexWrap: 'wrap' }}>
            <StatBox label="Eventos" value={String(events.length)} />
            <StatBox label="Errores" value={String(events.filter((e) => e.level === 'error').length)} tone={colors.danger} />
            <StatBox label="Promedio" value={`${avg} ms`} />
            <StatBox label="p95" value={`${p95} ms`} />
          </Row>
          <ChipGroup
            options={[
              { value: 'all' as const, label: 'Todos' },
              { value: 'info' as const, label: 'Info' },
              { value: 'warn' as const, label: 'Lentos' },
              { value: 'error' as const, label: 'Errores' },
            ]}
            value={level}
            onChange={setLevel}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          {list.length === 0 ? (
            <EmptyState icon="pulse-outline" title="Sin eventos registrados" />
          ) : (
            <View style={styles.list}>
              {list.map((e, i) => (
                <View key={e.id} style={[styles.row, i > 0 && styles.border]}>
                  <Text style={styles.date}>{formatDateTime(e.date)}</Text>
                  <Badge label={e.level.toUpperCase()} tone={LEVEL_TONE[e.level]} />
                  <Text style={styles.op}>{e.operation}</Text>
                  {e.durationMs != null && <Text style={styles.ms}>{e.durationMs} ms</Text>}
                  <Text style={styles.meta}>
                    {e.platform ?? '—'} · v{e.version ?? '—'}
                    {e.message ? ` · ${e.message}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  env: { gap: spacing.xs, alignItems: 'flex-start' },
  envText: { fontSize: font.sm, color: colors.textSecondary },
  error: { color: colors.danger, fontFamily: fonts.bold },
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  date: { fontSize: font.xs, color: colors.textSecondary, width: 96 },
  op: { fontSize: font.sm, fontFamily: fonts.bold, color: colors.text, minWidth: 160 },
  ms: { fontSize: font.sm, fontFamily: fonts.extrabold, color: colors.primary, minWidth: 60 },
  meta: { fontSize: font.xs, color: colors.textSecondary, flex: 1, minWidth: 160 },
});
