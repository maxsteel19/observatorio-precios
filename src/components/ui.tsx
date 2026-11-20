// Componentes básicos reutilizables en todas las pantallas.
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, font, radius, shadow, spacing } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

// ---------- Contenedores ----------

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

/** ScrollView con padding y espacio inferior para la barra del sistema. */
export function Content({ children, contentContainerStyle, ...props }: ScrollViewProps & { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }, contentContainerStyle]}
      {...props}>
      {children}
    </ScrollView>
  );
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
      {children}
    </Pressable>
  );
}

export function Row({ children, style, gap = spacing.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

/** Enlace pequeño a la derecha de un título de sección («Ver todo»). */
export function SectionLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={10} style={({ pressed }) => [styles.sectionLink, pressed && { opacity: 0.6 }]}>
      <Text style={styles.sectionLinkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={15} color={colors.primary} />
    </Pressable>
  );
}

// ---------- Botones ----------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const palette = {
    primary: { bg: colors.action, fg: colors.white, border: colors.action },
    accent: { bg: colors.accent, fg: colors.white, border: colors.accent },
    secondary: { bg: colors.surface, fg: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.surface, fg: colors.danger, border: colors.danger },
  }[variant];
  const raised = variant === 'primary' || variant === 'accent';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: palette.bg, borderColor: palette.border },
        raised && !disabled && !small && styles.buttonRaised,
        (disabled || loading) && { opacity: 0.45 },
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={palette.fg} />}
          <Text style={[styles.buttonText, small && { fontSize: font.sm }, { color: palette.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.white,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  label: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

// ---------- Etiquetas ----------

type BadgeTone = 'offer' | 'ocr' | 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

const BADGE_COLORS: Record<BadgeTone, { bg: string; fg: string }> = {
  offer: { bg: colors.accentLight, fg: colors.accentDark },
  ocr: { bg: colors.infoLight, fg: colors.info },
  success: { bg: colors.successLight, fg: colors.success },
  warning: { bg: colors.warningLight, fg: colors.warning },
  danger: { bg: colors.dangerLight, fg: colors.danger },
  neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
  primary: { bg: colors.primaryLight, fg: colors.primary },
};

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: IconName }) {
  const c = BADGE_COLORS[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      {icon && <Ionicons name={icon} size={11} color={c.fg} />}
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
      {icon && <Ionicons name={icon} size={14} color={selected ? colors.white : colors.textSecondary} />}
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup<T extends string | number | null>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipGroup}>
      {options.map((o) => (
        <Chip key={String(o.value)} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

// ---------- Formularios ----------

export function Field({
  label,
  error,
  hint,
  secure,
  icon,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label: string; error?: string | null; hint?: string; secure?: boolean; icon?: IconName }) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, style as StyleProp<ViewStyle>]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          props.multiline && { borderRadius: radius.md },
          focused && styles.inputFocused,
          !!error && { borderColor: colors.danger },
        ]}>
        {icon && (
          <View style={styles.inputIcon}>
            <Ionicons name={icon} size={19} color={focused ? colors.primary : colors.textMuted} />
          </View>
        )}
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure && hidden}
          style={[styles.input, !!icon && { paddingLeft: 4 }, props.multiline && styles.inputMultiline]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {secure && (
          <Pressable
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            style={{ paddingHorizontal: spacing.lg }}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function SwitchRow({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.switchLabel}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.action, false: '#CBD5E1' }}
        thumbColor={colors.white}
      />
    </Pressable>
  );
}

export function SearchBox({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.searchBox}>
      <Ionicons name="search" size={19} color={colors.primary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoFocus={autoFocus}
        style={styles.searchInput}
      />
      {value.length > 0 && (
        <Pressable accessibilityLabel="Borrar búsqueda" onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={19} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

// ---------- Datos ----------

export function StatBox({ label, value, tone, sub }: { label: string; value: string; tone?: string; sub?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone ? { color: tone } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {text && <Text style={styles.emptyText}>{text}</Text>}
    </View>
  );
}

export function Avatar({ text, color = colors.primary, bg = colors.primaryLight, size = 40 }: { text: string; color?: string; bg?: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ color, fontFamily: fonts.bold, fontSize: size * 0.36 }}>{text}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#EDF1F6',
    ...shadow.card,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: font.lg + 1,
    fontFamily: fonts.extrabold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionLinkText: { fontSize: font.sm, fontFamily: fonts.bold, color: colors.primary },
  button: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonRaised: { boxShadow: '0 8px 18px rgba(63, 125, 23, 0.28)' },
  buttonSmall: { minHeight: 38, paddingHorizontal: spacing.lg },
  buttonText: { fontSize: font.md, fontFamily: fonts.bold },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: font.xs, fontFamily: fonts.bold },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.sm, fontFamily: fonts.semibold, color: colors.textSecondary },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  field: { gap: 7 },
  label: { fontSize: font.sm, fontFamily: fonts.semibold, color: colors.text },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  inputFocused: { borderColor: colors.primary, boxShadow: '0 0 0 4px rgba(18, 66, 128, 0.10)' },
  inputIcon: { paddingLeft: spacing.lg, paddingRight: 6 },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    fontSize: font.md,
    color: colors.text,
  },
  inputMultiline: { minHeight: 104, paddingTop: spacing.md, textAlignVertical: 'top' },
  error: { fontSize: font.xs, color: colors.danger, fontFamily: fonts.semibold, paddingLeft: spacing.sm },
  hint: { fontSize: font.xs, color: colors.textSecondary, paddingLeft: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  switchLabel: { fontSize: font.md, fontFamily: fonts.semibold, color: colors.text },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  searchInput: { flex: 1, minHeight: 50, fontSize: font.md, color: colors.text },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  statLabel: { fontSize: font.xs, color: colors.textSecondary, fontFamily: fonts.semibold },
  statValue: { fontSize: font.xl, fontFamily: fonts.extrabold, color: colors.text },
  statSub: { fontSize: font.xs, color: colors.textSecondary },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: font.lg, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' },
  emptyText: { fontSize: font.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
});
