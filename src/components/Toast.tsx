import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, font, radius, shadow, spacing } from '@/theme';

type ToastType = 'success' | 'error' | 'info';

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (message: string, type: ToastType = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: false }).start(() => setToast(null));
    }, 2400);
  };

  const icon = toast?.type === 'success' ? 'checkmark-circle' : toast?.type === 'error' ? 'alert-circle' : 'information-circle';
  const bg = toast?.type === 'success' ? colors.success : toast?.type === 'error' ? colors.danger : colors.text;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[styles.toast, { opacity, bottom: insets.bottom + 80, backgroundColor: bg }]}>
          <Ionicons name={icon} size={20} color={colors.white} />
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: 440,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    ...shadow.raised,
    pointerEvents: 'none',
  },
  text: { color: colors.white, fontSize: font.sm, fontFamily: fonts.semibold, flexShrink: 1 },
});
