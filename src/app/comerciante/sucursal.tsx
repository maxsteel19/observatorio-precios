// Comerciante · Agregar o editar una sucursal (con ubicación en el mapa).
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { IllustratedMap } from '@/components/IllustratedMap';
import { useToast } from '@/components/Toast';
import { Button, Content, Field, Screen, SwitchRow } from '@/components/ui';
import { CENTER } from '@/data/stores';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, spacing } from '@/theme';

export default function BranchForm() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { stores, session, saveStore } = useApp();
  const existing = id ? stores.find((s) => s.id === Number(id)) : undefined;

  const [branch, setBranch] = useState(existing?.branch ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [hours, setHours] = useState(existing?.hours ?? 'Lun–Sáb 9:00–20:00');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [pos, setPos] = useState<{ x: number; y: number } | null>(existing?.map ?? null);
  const [active, setActive] = useState(existing?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!branch.trim() || !address.trim()) return setError('Completa el nombre y la dirección');
    if (!pos) return setError('Toca el mapa para ubicar la sucursal');
    setError(null);
    saveStore({
      id: existing?.id,
      name: session?.name ?? 'Comercio',
      branch: branch.trim(),
      address: address.trim(),
      hours: hours.trim(),
      phone: phone.trim() || undefined,
      // Aproximación de coordenadas a partir de la posición en el mapa ilustrado.
      lat: CENTER.lat + (50 - pos.y) * 0.00018,
      lng: CENTER.lng + (pos.x - 50) * 0.00022,
      map: pos,
      type: existing?.type ?? 'minimarket',
      merchant: session?.name,
      active,
    });
    toast(existing ? 'Sucursal actualizada' : 'Sucursal agregada', 'success');
    if (router.canGoBack()) router.back();
    else router.replace('/comerciante/sucursales');
  };

  return (
    <Screen>
      <AppHeader title={existing ? 'Editar sucursal' : 'Agregar sucursal'} role="comerciante" back backTo="/comerciante/sucursales" />
      <Content contentContainerStyle={{ gap: spacing.lg }}>
        <Field label="Nombre de la sucursal" value={branch} onChangeText={setBranch} placeholder="Sucursal Centro" />
        <Field label="Dirección" value={address} onChangeText={setAddress} placeholder="Av. Departamental 1234" hint="Comuna: Pedro Aguirre Cerda" />
        <Field label="Horario" value={hours} onChangeText={setHours} placeholder="Lun–Sáb 9:00–20:00" />
        <Field label="Teléfono de contacto" value={phone} onChangeText={setPhone} placeholder="+56 2 2555 0000" keyboardType="phone-pad" />
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Ubicación en el mapa</Text>
          <IllustratedMap
            height={240}
            legend={false}
            title={pos ? 'Ubicación seleccionada' : 'Toca el mapa para ubicar'}
            pins={pos ? [{ id: 0, x: pos.x, y: pos.y, selected: true }] : []}
            onMapPress={setPos}
          />
        </View>
        <SwitchRow label="Sucursal activa" hint="Las sucursales inactivas no aparecen en las búsquedas." value={active} onChange={setActive} />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Guardar sucursal" icon="checkmark" onPress={save} />
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.sm, fontFamily: fonts.semibold, color: colors.text },
  error: { color: colors.danger, fontFamily: fonts.bold, fontSize: font.sm },
});
