// Administrador · Usuarios y roles.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/AdminScreen';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { Avatar, Badge, Button, Card, ChipGroup, EmptyState, Field, SearchBox } from '@/components/ui';
import { normalize } from '@/lib/format';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, roleInfo, spacing, type Role } from '@/theme';

const STAFF_ROLES: Role[] = ['admin', 'fiscalizador', 'comerciante'];

export default function UsersAdmin() {
  const toast = useToast();
  const { users, session, addUser, toggleUser } = useApp();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<Role | 'all'>('all');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('fiscalizador');
  const [error, setError] = useState<string | null>(null);

  const q = normalize(query);
  const list = users.filter(
    (u) => (role === 'all' || u.role === role) && (!q || normalize(u.name).includes(q) || u.email.includes(q)),
  );

  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const save = async () => {
    const result = await addUser({ name, email, role: newRole });
    if (result.error) return setError(result.error);
    toast(`Usuario creado: ${name.trim()}`, 'success');
    // Con Supabase la cuenta se crea con una contraseña temporal que se muestra una sola vez.
    if (result.tempPassword) setCreated({ email: email.trim().toLowerCase(), password: result.tempPassword });
    setOpen(false);
    setName('');
    setEmail('');
    setError(null);
  };

  return (
    <AdminScreen
      title="Usuarios del sistema"
      subtitle={`${users.filter((u) => u.active).length} cuentas activas`}
      actions={<Button small title="Nuevo usuario" icon="person-add" onPress={() => setOpen(true)} />}>
      {created && (
        <Card style={styles.created}>
          <Text style={styles.createdTitle}>Cuenta creada: {created.email}</Text>
          <Text style={styles.createdText} selectable>
            Contraseña temporal: <Text style={{ fontFamily: fonts.extrabold }}>{created.password}</Text>
          </Text>
          <Text style={styles.createdHint}>Entrégala a la persona por un canal seguro. No se volverá a mostrar.</Text>
          <Button small title="Listo" variant="secondary" onPress={() => setCreated(null)} />
        </Card>
      )}
      <SearchBox value={query} onChangeText={setQuery} placeholder="Buscar por nombre o email…" />
      <ChipGroup
        options={[{ value: 'all' as const, label: 'Todos' }, ...STAFF_ROLES.map((r) => ({ value: r, label: roleInfo[r].label }))]}
        value={role}
        onChange={setRole}
      />
      {list.length === 0 ? (
        <EmptyState icon="people-outline" title="Sin usuarios con estos filtros" />
      ) : (
        <View style={styles.list}>
          {list.map((u, i) => (
            <View key={u.id} style={[styles.row, i > 0 && styles.border, !u.active && { opacity: 0.6 }]}>
              <Avatar text={u.name[0]!.toUpperCase()} color={roleInfo[u.role].color} bg={roleInfo[u.role].bg} size={36} />
              <View style={{ flex: 1, minWidth: 160 }}>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.meta}>{u.email}</Text>
              </View>
              <View style={[styles.rolePill, { backgroundColor: roleInfo[u.role].bg }]}>
                <Text style={[styles.roleText, { color: roleInfo[u.role].color }]}>{roleInfo[u.role].label}</Text>
              </View>
              <Badge label={u.active ? 'Activo' : 'Inactivo'} tone={u.active ? 'success' : 'neutral'} />
              <Button
                small
                title={u.active ? 'Desactivar' : 'Activar'}
                variant={u.active ? 'danger' : 'secondary'}
                disabled={u.email === session?.email}
                onPress={async () => {
                  const err = await toggleUser(u.id);
                  if (err) toast(err, 'error');
                }}
              />
            </View>
          ))}
        </View>
      )}

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Nuevo usuario"
        footer={
          <>
            <Button title="Cancelar" variant="secondary" style={{ flex: 1 }} onPress={() => setOpen(false)} />
            <Button title="Crear usuario" style={{ flex: 1 }} onPress={() => void save()} />
          </>
        }>
        <Field label="Nombre completo" value={name} onChangeText={setName} placeholder="Nombre Apellido" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@municipalidad.cl"
          autoCapitalize="none"
          keyboardType="email-address"
          error={error}
        />
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Rol</Text>
          <ChipGroup options={STAFF_ROLES.map((r) => ({ value: r, label: roleInfo[r].label }))} value={newRole} onChange={setNewRole} />
        </View>
      </Sheet>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: font.md, fontFamily: fonts.bold, color: colors.text },
  meta: { fontSize: font.xs, color: colors.textSecondary },
  rolePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  roleText: { fontSize: font.xs, fontFamily: fonts.bold },
  label: { fontSize: font.sm, fontFamily: fonts.semibold, color: colors.text },
  created: { gap: spacing.sm, backgroundColor: colors.primaryLight, boxShadow: 'none' },
  createdTitle: { fontSize: font.md, fontFamily: fonts.bold, color: colors.primaryDark },
  createdText: { fontSize: font.md, color: colors.text },
  createdHint: { fontSize: font.xs, color: colors.textSecondary },
});
