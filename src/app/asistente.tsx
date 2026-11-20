// Ciudadano · Asistente del Observatorio: chat con IA (OpenAI / DeepSeek) sobre los datos de la app.
// Si no hay conexión con el servidor, responde con los datos locales.
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { IconButton } from '@/components/ui';
import { askAssistant, buildContext, localAnswer, type ChatTurn } from '@/lib/assistant';
import { newId } from '@/data/seed';
import { useApp } from '@/state/AppState';
import { colors, fonts, font, radius, shadow, spacing } from '@/theme';

type Message = ChatTurn & { id: string; offline?: boolean };

const WELCOME: Message = {
  id: 'bienvenida',
  role: 'assistant',
  content:
    '¡Hola! Soy el asistente del **Observatorio Municipal de Precios**. Pregúntame dónde está más barato un producto, qué bencinera conviene, cómo sacar la Tarjeta Vecina o qué hay en los especiales de temporada.',
};

const SUGGESTIONS = [
  '¿Dónde está más barato el arroz?',
  '¿Qué bencinera tiene la 93 más barata?',
  '¿Cómo saco la Tarjeta Vecina?',
  'Quiero hacer una cazuela barata',
  '¿Qué hay para Navidad?',
];

export default function Assistant() {
  const insets = useSafeAreaInsets();
  const { stores, catalog, prices } = useApp();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  // Baja al último mensaje cuando llega una respuesta. En la web se mueve el elemento con scroll
  // directamente, porque scrollToEnd usa medidas desactualizadas.
  const scrollToBottom = () => {
    const s = scrollRef.current as unknown as {
      scrollToEnd: (o?: { animated?: boolean }) => void;
      getScrollableNode?: () => HTMLElement | null;
    } | null;
    if (!s) return;
    const node = Platform.OS === 'web' ? s.getScrollableNode?.() : null;
    if (node) node.scrollTop = node.scrollHeight;
    else s.scrollToEnd({ animated: true });
  };
  useEffect(() => {
    // Dos intentos: tras dibujar el mensaje y tras cargar fuentes o emojis.
    const timers = [setTimeout(scrollToBottom, 120), setTimeout(scrollToBottom, 600)];
    return () => timers.forEach(clearTimeout);
  }, [messages.length, loading]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    const userMsg: Message = { id: newId('msg'), role: 'user', content: question };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    const data = { stores, catalog, prices };
    try {
      const reply = await askAssistant(
        history.map(({ role, content }) => ({ role, content })),
        buildContext(data),
      );
      setMessages((m) => [...m, { id: newId('msg'), role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { id: newId('msg'), role: 'assistant', content: localAnswer(question, data), offline: true }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([WELCOME]);
    setInput('');
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Asistente" back right={<IconButton icon="refresh" label="Nueva conversación" onPress={reset} />} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}>
          <View style={styles.intro}>
            <LinearGradient colors={['#1A55A0', colors.primaryDark]} style={styles.botAvatarBig}>
              <Ionicons name="sparkles" size={26} color={colors.yellow} />
            </LinearGradient>
            <Text style={styles.introTitle}>Asistente del Observatorio</Text>
            <Text style={styles.introText}>Responde con los precios y servicios de la app usando inteligencia artificial.</Text>
          </View>

          {messages.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}

          {loading && (
            <View style={[styles.row, styles.rowBot]}>
              <BotAvatar />
              <View style={[styles.bubble, styles.bubbleBot, styles.typing]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>Revisando los precios…</Text>
              </View>
            </View>
          )}

          {messages.length === 1 && !loading && (
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => send(s)} style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: spacing.sm + insets.bottom }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escribe tu pregunta…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={600}
            style={styles.input}
            onSubmitEditing={() => send(input)}
            submitBehavior="submit"
            returnKeyType="send"
            onKeyPress={(e) => {
              // En la web, Enter envía y Shift+Enter agrega una línea.
              const shift = (e.nativeEvent as { shiftKey?: boolean }).shiftKey;
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !shift) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar pregunta"
            disabled={!input.trim() || loading}
            onPress={() => send(input)}
            style={({ pressed }) => [styles.send, (!input.trim() || loading) && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.95 }] }]}>
            <Ionicons name="send" size={19} color={colors.white} />
          </Pressable>
        </View>
        <Text style={[styles.disclaimer, { marginBottom: insets.bottom ? 0 : 4 }]}>
          El asistente puede equivocarse: confirma los precios en la app.
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

function BotAvatar() {
  return (
    <View style={styles.botAvatar}>
      <Ionicons name="sparkles" size={14} color={colors.yellow} />
    </View>
  );
}

function Bubble({ message }: { message: Message }) {
  const mine = message.role === 'user';
  return (
    <View style={[styles.row, mine ? styles.rowUser : styles.rowBot]}>
      {!mine && <BotAvatar />}
      <View style={[styles.bubble, mine ? styles.bubbleUser : styles.bubbleBot]}>
        <RichText text={message.content} color={mine ? colors.white : colors.text} />
        {message.offline && (
          <View style={styles.offline}>
            <Ionicons name="cloud-offline-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.offlineText}>Respuesta sin conexión, con los datos guardados en la app</Text>
          </View>
        )}
      </View>
    </View>
  );
}

/** Texto con **negrita** y listas con guiones, que es lo que pedimos a la IA. */
function RichText({ text, color }: { text: string; color: string }) {
  const lines = text.split('\n').filter((l, i, all) => l.trim() || (i > 0 && all[i - 1]!.trim()));
  return (
    <View style={{ gap: 3 }}>
      {lines.map((line, i) => {
        const bullet = /^\s*([-•*]|\d+\.)\s+/.exec(line);
        const content = bullet ? line.slice(bullet[0].length) : line;
        const parts = content.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        const body = (
          <Text style={[styles.msgText, { color }]}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**') ? (
                <Text key={j} style={{ fontFamily: fonts.bold }}>
                  {p.slice(2, -2)}
                </Text>
              ) : (
                p
              ),
            )}
          </Text>
        );
        if (!line.trim()) return <View key={i} style={{ height: 4 }} />;
        return bullet ? (
          <View key={i} style={{ flexDirection: 'row', gap: 6, paddingLeft: 2 }}>
            <Text style={[styles.msgText, { color }]}>•</Text>
            <View style={{ flex: 1 }}>{body}</View>
          </View>
        ) : (
          <View key={i}>{body}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.md },
  intro: { alignItems: 'center', gap: 6, paddingVertical: spacing.md },
  botAvatarBig: { width: 60, height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...shadow.raised },
  introTitle: { fontSize: font.lg + 1, fontFamily: fonts.extrabold, color: colors.text, marginTop: 4 },
  introText: { fontSize: font.sm, color: colors.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  rowUser: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubbleBot: { backgroundColor: colors.surface, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: '#EDF1F6', ...shadow.card },
  msgText: { fontSize: font.md, lineHeight: 21 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typingText: { fontSize: font.sm, color: colors.textSecondary, fontFamily: fonts.semibold },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#EDF1F6' },
  offlineText: { fontSize: font.xs, color: colors.textSecondary, flexShrink: 1 },
  suggestions: { gap: spacing.sm, alignItems: 'flex-end', marginTop: spacing.xs },
  suggestion: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#D3E0F2',
  },
  suggestionText: { fontSize: font.sm, fontFamily: fonts.bold, color: colors.primary },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 23,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: font.md,
    color: colors.text,
  },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { fontSize: font.xs, color: colors.textMuted, textAlign: 'center', backgroundColor: colors.surface, paddingBottom: 4 },
});
