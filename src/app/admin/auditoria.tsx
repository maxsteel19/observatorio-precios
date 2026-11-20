// Administrador · Log de auditoría (solo lectura).
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/AdminScreen';
import { Badge, ChipGroup, EmptyState, Icon } from '@/components/ui';
import type { AuditEntry } from '@/data/seed';
import { formatDateTime } from '@/lib/format';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, spacing } from '@/theme';

const TABLES: AuditEntry['table'][] = ['precios', 'productos', 'comercios', 'usuarios', 'solicitudes', 'reportes'];

const OP_TONE = { INSERT: 'success', UPDATE: 'warning', DELETE: 'danger' } as const;

export default function AuditLog() {
  const { audit } = useApp();
  const [table, setTable] = useState<AuditEntry['table'] | 'all'>('all');
  const list = audit.filter((a) => table === 'all' || a.table === table);

  return (
    <AdminScreen title="Log de auditoría" subtitle={`${audit.length} eventos registrados`}>
      <View style={styles.banner}>
        <Icon name="lock-closed" size={16} color={colors.info} />
        <Text style={styles.bannerText}>Registro inmutable · Solo lectura · No se puede editar ni eliminar</Text>
      </View>
      <ChipGroup
        options={[{ value: 'all' as const, label: 'Todas las tablas' }, ...TABLES.map((t) => ({ value: t, label: t }))]}
        value={table}
        onChange={setTable}
      />
      {list.length === 0 ? (
        <EmptyState icon="document-text-outline" title="Sin eventos para esta tabla" />
      ) : (
        <View style={styles.list}>
          {list.map((a, i) => (
            <View key={a.id} style={[styles.row, i > 0 && styles.border]}>
              <Text style={styles.date}>{formatDateTime(a.date)}</Text>
              <Text style={styles.user}>{a.user}</Text>
              <Badge label={a.table} tone="primary" />
              <Badge label={a.operation} tone={OP_TONE[a.operation]} />
              <Text style={styles.detail}>{a.detail}</Text>
            </View>
          ))}
        </View>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  bannerText: { color: colors.info, fontFamily: fonts.bold, fontSize: font.sm, flex: 1 },
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  date: { fontSize: font.xs, color: colors.textSecondary, width: 96 },
  user: { fontSize: font.sm, fontFamily: fonts.bold, color: colors.text, minWidth: 110 },
  detail: { fontSize: font.sm, color: colors.text, flex: 1, minWidth: 200 },
});
