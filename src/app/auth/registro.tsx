// Registro de comerciante en 2 pasos. La solicitud queda pendiente hasta que un administrador la apruebe.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Button, ChipGroup, Content, Field, Row, Screen } from '@/components/ui';
import { STORE_TYPES, type StoreType } from '@/data/stores';
import { formatRut, isValidRut } from '@/lib/rut';
import { useApp } from '@/state/AppState';
import { colors, font, spacing } from '@/theme';

type Errors = Partial<Record<string, string>>;

export default function Register() {
  const router = useRouter();
  const { registerMerchant } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Errors>({});

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const [comercio, setComercio] = useState('');
  const [rutEmpresa, setRutEmpresa] = useState('');
  const [tipo, setTipo] = useState<StoreType | null>(null);
  const [telefono, setTelefono] = useState('');

  const nextStep = () => {
    const e: Errors = {};
    if (!nombre.trim()) e.nombre = 'Requerido';
    if (!apellido.trim()) e.apellido = 'Requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Email no válido';
    if (!isValidRut(rut)) e.rut = 'RUT no válido (revisa el dígito verificador)';
    if (password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (password2 !== password) e.password2 = 'Las contraseñas no coinciden';
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(2);
  };

  const submit = () => {
    const e: Errors = {};
    if (!comercio.trim()) e.comercio = 'Requerido';
    if (!isValidRut(rutEmpresa)) e.rutEmpresa = 'RUT no válido';
    if (!tipo) e.tipo = 'Selecciona un tipo de comercio';
    if (telefono.replace(/\D/g, '').length < 8) e.telefono = 'Teléfono no válido';
    setErrors(e);
    if (Object.keys(e).length > 0 || !tipo) return;
    const id = registerMerchant({
      comercio: comercio.trim(),
      rutEmpresa: formatRut(rutEmpresa),
      tipo,
      telefono: telefono.trim(),
      nombre: `${nombre.trim()} ${apellido.trim()}`,
      email: email.trim().toLowerCase(),
      rut: formatRut(rut),
    });
    // Solo el id va en la URL (no datos personales como el email).
    router.replace({ pathname: '/auth/pendiente', params: { id } });
  };

  return (
    <Screen>
      <AppHeader
        title="Registro de comerciante"
        back
        backTo="/auth/login"
        onBack={step === 2 ? () => setStep(1) : undefined}
      />
      <Content contentContainerStyle={{ gap: spacing.lg }}>
        <View style={styles.stepper}>
          <View style={[styles.step, styles.stepActive]}>
            <Text style={styles.stepText}>{step === 2 ? '✓' : '1'}</Text>
          </View>
          <View style={[styles.stepLine, step === 2 && { backgroundColor: colors.primary }]} />
          <View style={[styles.step, step === 2 && styles.stepActive]}>
            <Text style={[styles.stepText, step !== 2 && { color: colors.textSecondary }]}>2</Text>
          </View>
        </View>

        {step === 1 ? (
          <>
            <View>
              <Text style={styles.title}>Datos de tu cuenta</Text>
              <Text style={styles.text}>Crea las credenciales con las que accederás al sistema.</Text>
            </View>
            <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
              <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Nombre" error={errors.nombre} style={{ flex: 1 }} />
              <Field label="Apellido" value={apellido} onChangeText={setApellido} placeholder="Apellido" error={errors.apellido} style={{ flex: 1 }} />
            </Row>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.cl"
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
            />
            <Field
              label="RUT"
              value={rut}
              onChangeText={(t) => setRut(formatRut(t))}
              placeholder="12.345.678-5"
              autoCapitalize="characters"
              hint="RUT personal del responsable"
              error={errors.rut}
            />
            <Field label="Contraseña" value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" secure error={errors.password} />
            <Field
              label="Confirmar contraseña"
              value={password2}
              onChangeText={setPassword2}
              placeholder="Repite la contraseña"
              secure
              error={errors.password2}
            />
            <Button title="Continuar" icon="arrow-forward" onPress={nextStep} />
          </>
        ) : (
          <>
            <View>
              <Text style={styles.title}>Datos del comercio</Text>
              <Text style={styles.text}>Información general. Las sucursales con ubicación se agregan después de la aprobación.</Text>
            </View>
            <Field label="Nombre del comercio" value={comercio} onChangeText={setComercio} placeholder="Minimarket El Sol" error={errors.comercio} />
            <Field
              label="RUT del comercio / empresa"
              value={rutEmpresa}
              onChangeText={(t) => setRutEmpresa(formatRut(t))}
              placeholder="76.123.456-0"
              autoCapitalize="characters"
              error={errors.rutEmpresa}
            />
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.label}>Tipo de comercio</Text>
              <ChipGroup options={STORE_TYPES.map((t) => ({ value: t.id, label: t.label }))} value={tipo} onChange={setTipo} />
              {errors.tipo && <Text style={styles.error}>{errors.tipo}</Text>}
            </View>
            <Field
              label="Teléfono de contacto"
              value={telefono}
              onChangeText={setTelefono}
              placeholder="+56 9 1234 5678"
              keyboardType="phone-pad"
              error={errors.telefono}
            />
            <Button title="Enviar solicitud" icon="send" onPress={submit} />
            <Button title="Volver" variant="ghost" onPress={() => setStep(1)} />
          </>
        )}
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: { backgroundColor: colors.primary },
  stepText: { color: colors.white, fontWeight: '800' },
  stepLine: { width: 64, height: 3, backgroundColor: colors.border, marginHorizontal: spacing.sm, borderRadius: 2 },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  text: { fontSize: font.sm, color: colors.textSecondary, marginTop: 2 },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  error: { fontSize: font.xs, color: colors.danger, fontWeight: '600' },
});
