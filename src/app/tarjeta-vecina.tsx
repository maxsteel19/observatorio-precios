// Ciudadano · Tarjeta Vecina PAC: qué es, requisitos, cómo pedirla, beneficios y comercios con convenio.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { HeaderLoginButton } from '@/components/HeaderLoginButton';
import { AppIcon } from '@/components/icons';
import { useToast } from '@/components/Toast';
import { Badge, Button, Card, Content, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { DIDESE, TARJETA_VECINA } from '@/data/didese';
import { storeLabel } from '@/data/stores';
import { mailUrl, openLink } from '@/lib/links';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, shadow, spacing } from '@/theme';

const LOGO = require('../../assets/images/logo-pac.png');
const LOGO_COLORS = [colors.red, colors.yellow, colors.sky, colors.lime];

export default function TarjetaVecina() {
  const router = useRouter();
  const toast = useToast();
  const { stores } = useApp();
  const partners = stores.filter((s) => s.active && s.tarjetaVecina);

  const open = async (url: string) => {
    if (!(await openLink(url))) toast('No se pudo abrir el enlace', 'error');
  };

  return (
    <Screen>
      <AppHeader title="Tarjeta Vecina PAC" back right={<HeaderLoginButton />} />
      <Content contentContainerStyle={{ gap: spacing.lg }}>
        {/* Ilustración de la tarjeta */}
        <LinearGradient colors={['#1D5BAA', colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.cardCircle} />
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.cardTitle}>Tarjeta Vecina</Text>
              <Text style={styles.cardSub}>Pedro Aguirre Cerda</Text>
            </View>
            <View style={styles.cardLogo}>
              <Image source={LOGO} style={{ width: 52, height: 52 }} contentFit="contain" accessibilityLabel="Logo municipal" />
            </View>
          </Row>
          <View style={styles.stripe}>
            {LOGO_COLORS.map((c) => (
              <View key={c} style={[styles.stripeBar, { backgroundColor: c }]} />
            ))}
          </View>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={styles.cardHolder}>Vecina o vecino de PAC</Text>
            <Ionicons name="qr-code" size={30} color="rgba(255,255,255,0.9)" />
          </Row>
        </LinearGradient>

        <View style={{ gap: 6 }}>
          <Text style={styles.lead}>Descuentos en comercios de la comuna por ser vecina o vecino.</Text>
          <Text style={styles.text}>
            Es la tarjeta de beneficios de la Municipalidad. Al mostrarla en los comercios con convenio obtienes descuentos en salud, mascotas,
            hogar, gastronomía y más. {TARJETA_VECINA.members} vecinas y vecinos ya la tienen.
          </Text>
        </View>

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.cardHeading}>Requisitos</Text>
          {TARJETA_VECINA.requirements.map((r) => (
            <Row key={r} gap={10}>
              <View style={styles.check}>
                <Ionicons name="checkmark" size={15} color={colors.white} />
              </View>
              <Text style={styles.item}>{r}</Text>
            </Row>
          ))}
        </Card>

        <SectionTitle>Cómo pedirla</SectionTitle>
        <View style={styles.ways}>
          <Card style={styles.way}>
            <View style={[styles.wayIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.wayTitle}>Con el código QR</Text>
            <Text style={styles.wayText}>Escanéalo en las publicaciones de la DIDESE y completa tus datos.</Text>
          </Card>
          <Card style={styles.way}>
            <View style={[styles.wayIcon, { backgroundColor: colors.actionLight }]}>
              <Ionicons name="business-outline" size={22} color={colors.action} />
            </View>
            <Text style={styles.wayTitle}>En la oficina</Text>
            <Text style={styles.wayText}>Acércate a la Dirección de Desarrollo Económico.</Text>
          </Card>
        </View>

        <Card style={{ gap: spacing.sm }}>
          <Text style={styles.cardHeading}>{DIDESE.name}</Text>
          <Row gap={8} style={{ alignItems: 'flex-start' }}>
            <Icon name="location-outline" size={17} color={colors.textSecondary} />
            <Text style={styles.info}>{DIDESE.address}</Text>
          </Row>
          {DIDESE.hours.map((h) => (
            <Row key={h.days} gap={8} style={{ alignItems: 'flex-start' }}>
              <Icon name="time-outline" size={17} color={colors.textSecondary} />
              <Text style={styles.info}>
                <Text style={{ fontFamily: fonts.bold, color: colors.text }}>{h.days}:</Text> {h.time}
              </Text>
            </Row>
          ))}
          <Row gap={8}>
            <Icon name="mail-outline" size={17} color={colors.textSecondary} />
            <Text style={styles.info}>{TARJETA_VECINA.email}</Text>
          </Row>
          <Row gap={spacing.sm} style={{ marginTop: spacing.sm }}>
            <Button title="Cómo llegar" icon="navigate" small style={{ flex: 1 }} onPress={() => open(DIDESE.mapsUrl)} />
            <Button
              title="Escribir"
              icon="mail-outline"
              variant="secondary"
              small
              style={{ flex: 1 }}
              onPress={() => open(mailUrl(TARJETA_VECINA.email))}
            />
          </Row>
        </Card>

        <SectionTitle>Beneficios</SectionTitle>
        <View style={styles.benefits}>
          {TARJETA_VECINA.categories.map((c) => (
            <View key={c.label} style={styles.benefit}>
              <AppIcon name={c.icon} size={42} style={{ marginBottom: 2 }} />
              <Text style={styles.benefitTitle}>{c.label}</Text>
              <Text style={styles.benefitText}>{c.detail}</Text>
            </View>
          ))}
        </View>

        <SectionTitle>Comercios del observatorio con convenio</SectionTitle>
        {partners.map((s) => (
          <Card key={s.id} onPress={() => router.push({ pathname: '/comercio/[id]', params: { id: String(s.id) } })} style={styles.partner}>
            <View style={styles.partnerIcon}>
              <Ionicons name="card" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.partnerName} numberOfLines={1}>
                {storeLabel(s)}
              </Text>
              <Text style={styles.partnerBenefit}>{s.tarjetaVecina}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        ))}
        <Row gap={6} style={{ justifyContent: 'center' }}>
          <Badge label="Convenios de ejemplo" tone="neutral" />
        </Row>
        <Text style={styles.foot}>Beneficios sujetos a las condiciones de cada convenio.</Text>
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, gap: spacing.lg, overflow: 'hidden', minHeight: 196, ...shadow.raised },
  cardCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    bottom: -90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { color: colors.white, fontSize: font.xxl, fontFamily: fonts.extrabold, letterSpacing: -0.6 },
  cardSub: { color: 'rgba(255,255,255,0.8)', fontSize: font.sm, fontFamily: fonts.semibold },
  cardLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stripe: { flexDirection: 'row', gap: 4, width: 120 },
  stripeBar: { flex: 1, height: 5, borderRadius: 3 },
  cardHolder: { color: 'rgba(255,255,255,0.9)', fontSize: font.md, fontFamily: fonts.bold },
  lead: { fontSize: font.xl, fontFamily: fonts.extrabold, color: colors.text, letterSpacing: -0.4, lineHeight: 26 },
  text: { fontSize: font.md, color: colors.textSecondary, lineHeight: 22 },
  cardHeading: { fontSize: font.md + 1, fontFamily: fonts.extrabold, color: colors.text },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' },
  item: { fontSize: font.md, color: colors.text, fontFamily: fonts.semibold },
  ways: { flexDirection: 'row', gap: spacing.md },
  way: { flex: 1, gap: 6, padding: spacing.md },
  wayIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  wayTitle: { fontSize: font.md, fontFamily: fonts.bold, color: colors.text },
  wayText: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 18 },
  info: { flex: 1, fontSize: font.sm + 1, color: colors.textSecondary, lineHeight: 20 },
  benefits: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  benefit: {
    width: '48%',
    flexGrow: 1,
    gap: 3,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#EDF1F6',
  },
  benefitTitle: { fontSize: font.md, fontFamily: fonts.bold, color: colors.text },
  benefitText: { fontSize: font.xs + 1, color: colors.textSecondary, lineHeight: 16 },
  partner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  partnerIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  partnerName: { fontSize: font.md, fontFamily: fonts.bold, color: colors.text },
  partnerBenefit: { fontSize: font.sm, color: colors.action, fontFamily: fonts.semibold },
  foot: { fontSize: font.xs, color: colors.textSecondary, textAlign: 'center' },
});
