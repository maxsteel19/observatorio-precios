// Acerca del Observatorio Municipal de Precios (DIDESE), apoyo a comercios locales y contacto.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/Toast';
import { Button, Card, IconButton, Row, Screen, SectionTitle, type IconName } from '@/components/ui';
import { DIDESE, FOMENTO } from '@/data/didese';
import { mailUrl, openLink, phoneUrl } from '@/lib/links';
import { SPECIALS_HREF } from '@/lib/routes';
import { colors, fonts, font, shadow, spacing } from '@/theme';

const LOGO = require('../../assets/images/logo-pac.png');

const SERVICES: { emoji: string; title: string; text: string; href: Href }[] = [
  { emoji: '🛒', title: 'Canasta básica', text: 'Precios de abarrotes, lácteos, carnes y verduras', href: '/resultados' },
  { emoji: '⛽', title: 'Bencinas', text: 'Bencina, diésel y parafina por estación', href: '/bencinas' },
  { emoji: '🎄', title: 'Especiales de temporada', text: 'Navidad, útiles escolares, Halloween y más', href: SPECIALS_HREF },
  { emoji: '💳', title: 'Tarjeta Vecina PAC', text: 'Descuentos en comercios con convenio', href: '/tarjeta-vecina' },
];

const SOURCES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'clipboard-outline', title: 'Fiscalizadores municipales', text: 'Recorren los comercios y fotografían las pizarras; la app lee los precios con OCR.' },
  { icon: 'storefront-outline', title: 'Comercios adheridos', text: 'Publican y actualizan sus propios precios y ofertas.' },
  { icon: 'people-outline', title: 'Vecinas y vecinos', text: 'Avisan cuando un precio publicado no coincide con el del local.' },
];

export default function About() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const open = async (url: string) => {
    if (!(await openLink(url))) toast('No se pudo abrir el enlace', 'error');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl + insets.bottom }}>
        <LinearGradient
          colors={['#1A55A0', colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
          <View style={[styles.circle, { width: 250, height: 250, right: -90, top: -90 }]} />
          <View style={styles.backRow}>
            <IconButton icon="arrow-back" label="Volver" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          </View>
          <View style={styles.logoWrap}>
            <Image source={LOGO} style={{ width: 82, height: 82 }} contentFit="contain" accessibilityLabel="Logo de la Municipalidad de Pedro Aguirre Cerda" />
          </View>
          <Text style={styles.heroTitle}>Observatorio Municipal de Precios</Text>
          <Text style={styles.heroText}>
            {DIDESE.name} ({DIDESE.short}) de la Municipalidad de Pedro Aguirre Cerda
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.lead}>Informarse también es una forma de cuidar el bolsillo.</Text>
          <Text style={styles.text}>
            El observatorio revisa los precios de la comuna para que puedas comparar antes de comprar y para apoyar a las emprendedoras y
            comerciantes locales.
          </Text>

          <SectionTitle>Qué puedes revisar</SectionTitle>
          {SERVICES.map((s) => (
            <Card key={s.title} onPress={() => router.push(s.href)} style={styles.row}>
              <View style={styles.rowArt}>
                <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{s.title}</Text>
                <Text style={styles.rowText}>{s.text}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
          ))}

          <SectionTitle>De dónde salen los precios</SectionTitle>
          <Card style={{ gap: spacing.md }}>
            {SOURCES.map((s) => (
              <Row key={s.title} gap={spacing.md} style={{ alignItems: 'flex-start' }}>
                <View style={styles.sourceIcon}>
                  <Ionicons name={s.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{s.title}</Text>
                  <Text style={styles.rowText}>{s.text}</Text>
                </View>
              </Row>
            ))}
          </Card>

          <SectionTitle>¿Tienes un negocio en la comuna?</SectionTitle>
          <Card style={{ gap: spacing.md }}>
            <Text style={styles.text}>
              La Oficina de Fomento Productivo te acompaña, estés comenzando o con tu negocio en marcha:
            </Text>
            {FOMENTO.map((f) => (
              <Row key={f.label} gap={spacing.md}>
                <View style={[styles.sourceIcon, { backgroundColor: colors.actionLight }]}>
                  <Ionicons name={f.icon} size={19} color={colors.action} />
                </View>
                <Text style={[styles.rowTitle, { flex: 1, fontFamily: fonts.semibold }]}>{f.label}</Text>
              </Row>
            ))}
            <Button title="Registrar mi comercio" icon="storefront" onPress={() => router.push('/auth/registro')} />
            <Button title="Escribir a Fomento Productivo" icon="mail-outline" variant="secondary" onPress={() => open(mailUrl(DIDESE.email))} />
          </Card>

          <SectionTitle>Contacto</SectionTitle>
          <Card style={{ gap: spacing.sm }}>
            <Pressable onPress={() => open(DIDESE.mapsUrl)}>
              <Row gap={8} style={{ alignItems: 'flex-start' }}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <Text style={styles.contact}>{DIDESE.address}</Text>
              </Row>
            </Pressable>
            {DIDESE.phones.map((p) => (
              <Pressable key={p} onPress={() => open(phoneUrl(p))}>
                <Row gap={8}>
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                  <Text style={styles.contact}>{p}</Text>
                </Row>
              </Pressable>
            ))}
            <Pressable onPress={() => open(mailUrl(DIDESE.email))}>
              <Row gap={8}>
                <Ionicons name="mail-outline" size={18} color={colors.primary} />
                <Text style={styles.contact}>{DIDESE.email}</Text>
              </Row>
            </Pressable>
            {DIDESE.hours.map((h) => (
              <Row key={h.days} gap={8} style={{ alignItems: 'flex-start' }}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.contact}>
                  <Text style={{ fontFamily: fonts.bold }}>{h.days}:</Text> {h.time}
                </Text>
              </Row>
            ))}
            <Row gap={spacing.sm} style={{ marginTop: spacing.sm }}>
              <Button title="Facebook" icon="logo-facebook" small variant="secondary" style={{ flex: 1 }} onPress={() => open(DIDESE.facebook)} />
              <Button title="Sitio web" icon="globe-outline" small variant="secondary" style={{ flex: 1 }} onPress={() => open(DIDESE.web)} />
            </Row>
          </Card>

          <Text style={styles.foot}>
            Proyecto presentado en la feria. Los precios, comercios y convenios que muestra la app son datos de demostración.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  backRow: { alignSelf: 'stretch', marginLeft: -spacing.lg },
  logoWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.primary,
    ...shadow.raised,
  },
  heroTitle: {
    color: colors.white,
    fontSize: font.xl + 2,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  heroText: { color: 'rgba(255,255,255,0.8)', fontSize: font.sm, fontFamily: fonts.semibold, textAlign: 'center', marginTop: 4 },
  body: { padding: spacing.lg, gap: spacing.md },
  lead: { fontSize: font.xl, fontFamily: fonts.extrabold, color: colors.text, letterSpacing: -0.4, lineHeight: 26, marginTop: spacing.sm },
  text: { fontSize: font.md, color: colors.textSecondary, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowArt: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: font.md, fontFamily: fonts.bold, color: colors.text },
  rowText: { fontSize: font.sm, color: colors.textSecondary, lineHeight: 18 },
  sourceIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  contact: { flex: 1, fontSize: font.sm + 1, color: colors.text, lineHeight: 20 },
  foot: { fontSize: font.xs, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, lineHeight: 16 },
});
