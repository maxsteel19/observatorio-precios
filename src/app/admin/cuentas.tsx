// Administrador · Solicitudes de registro de comerciantes pendientes de aprobación.
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/AdminScreen';
import { useToast } from '@/components/Toast';
import { Badge, Button, Card, EmptyState, Row } from '@/components/ui';
import { storeTypeLabel } from '@/data/stores';
import { formatDateTime } from '@/lib/format';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, spacing } from '@/theme';

export default function PendingAccounts() {
  const toast = useToast();
  const { pending, approveMerchant, rejectMerchant } = useApp();

  return (
    <AdminScreen title="Cuentas pendientes" subtitle="Comerciantes que solicitaron acceso al sistema">
      {pending.length === 0 ? (
        <EmptyState
          icon="checkmark-done-circle-outline"
          title="No hay cuentas pendientes"
          text="Todas las solicitudes de registro de comerciantes han sido revisadas."
        />
      ) : (
        <View style={styles.grid}>
          {pending.map((p) => (
            <Card key={p.id} style={styles.card}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{p.comercio}</Text>
                  <Text style={styles.meta}>Solicitado {formatDateTime(p.date)}</Text>
                </View>
                <Badge label="En revisión" tone="warning" />
              </Row>
              <View style={styles.details}>
                <Detail label="Tipo" value={storeTypeLabel(p.tipo)} />
                <Detail label="RUT empresa" value={p.rutEmpresa} />
                <Detail label="Responsable" value={`${p.nombre} · ${p.rut}`} />
                <Detail label="Contacto" value={`${p.email} · ${p.telefono}`} />
              </View>
              <Row gap={spacing.sm}>
                <Button
                  small
                  title="Rechazar"
                  variant="danger"
                  style={{ flex: 1 }}
                  onPress={() => {
                    rejectMerchant(p.id);
                    toast(`Solicitud rechazada: ${p.comercio}`);
                  }}
                />
                <Button
                  small
                  title="Aprobar"
                  icon="checkmark"
                  style={{ flex: 1 }}
                  onPress={() => {
                    approveMerchant(p.id);
                    toast(`Cuenta aprobada: ${p.comercio}`, 'success');
                  }}
                />
              </Row>
            </Card>
          ))}
        </View>
      )}
    </AdminScreen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { flexGrow: 1, flexBasis: 320, gap: spacing.md },
  name: { fontSize: font.lg, fontFamily: fonts.extrabold, color: colors.text },
  meta: { fontSize: font.xs, color: colors.textSecondary },
  details: { gap: spacing.sm },
  detail: { gap: 1 },
  detailLabel: { fontSize: font.xs, color: colors.textSecondary, fontFamily: fonts.semibold },
  detailValue: { fontSize: font.sm, color: colors.text },
});
