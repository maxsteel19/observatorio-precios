// Ciudadano · Lista de especiales de temporada del observatorio.
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { HeaderLoginButton } from '@/components/HeaderLoginButton';
import { Content, Screen } from '@/components/ui';
import { STATUS_LABEL, sortedSpecials, specialStatus } from '@/data/specials';
import { colors, fonts, font, radius, spacing } from '@/theme';

export default function Specials() {
  const router = useRouter();
  return (
    <Screen>
      <AppHeader title="Especiales" back right={<HeaderLoginButton />} />
      <Content>
        <Text style={styles.intro}>
          Comparativas del Observatorio Municipal de Precios para cada fecha importante, con productos de comercios y emprendimientos de la
          comuna.
        </Text>
        {sortedSpecials().map((s) => {
          const status = specialStatus(s);
          return (
            <Pressable
              key={s.id}
              onPress={() => router.push({ pathname: '/especiales/[id]', params: { id: s.id } })}
              style={({ pressed }) => [pressed && { transform: [{ scale: 0.985 }] }, status === 'anterior' && { opacity: 0.85 }]}>
              <LinearGradient colors={s.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
                <View style={styles.circle} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={[styles.status, status === 'vigente' && { backgroundColor: colors.yellow }]}>
                    <Text style={[styles.statusText, status === 'vigente' && { color: colors.primaryDark }]}>{STATUS_LABEL[status]}</Text>
                  </View>
                  <Text style={styles.title}>{s.title}</Text>
                  <Text style={styles.summary}>{s.summary}</Text>
                  <Text style={styles.period}>{s.period}</Text>
                </View>
                <Text style={styles.emoji}>{s.emoji}</Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: font.md, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.xs },
  card: { borderRadius: radius.lg + 2, padding: 18, flexDirection: 'row', alignItems: 'center', gap: spacing.md, overflow: 'hidden' },
  circle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    right: -30,
    top: -40,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  status: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusText: { color: colors.white, fontSize: font.xs, fontFamily: fonts.bold },
  title: { color: colors.white, fontSize: font.xl + 1, fontFamily: fonts.extrabold, letterSpacing: -0.4 },
  summary: { color: 'rgba(255,255,255,0.92)', fontSize: font.sm, fontFamily: fonts.medium },
  period: { color: 'rgba(255,255,255,0.75)', fontSize: font.xs + 1, fontFamily: fonts.semibold },
  emoji: { fontSize: 54 },
});
