// src/ui/components/Toast.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, AlertTriangle, Info, AlertCircle } from 'lucide-react-native';
import { theme } from '@/ui/theme';

type Variant = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  variant: Variant;
  duration: number;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (message: string, opts?: { variant?: Variant; duration?: number; action?: ToastAction }) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback(
    (message: string, opts?: { variant?: Variant; duration?: number; action?: ToastAction }) => {
      const id = ++idRef.current;
      const item: ToastItem = {
        id,
        message,
        variant: opts?.variant ?? 'info',
        duration: opts?.duration ?? 2800,
        action: opts?.action,
      };
      setQueue((q) => [...q, item]);
    },
    [],
  );

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, { variant: 'success' }),
    error: (m) => show(m, { variant: 'error' }),
    warning: (m) => show(m, { variant: 'warning' }),
    info: (m) => show(m, { variant: 'info' }),
  };

  const dismiss = useCallback((id: number) => {
    setQueue((q) => q.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack queue={queue} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastStack({ queue, onDismiss }: { queue: ToastItem[]; onDismiss: (id: number) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.stack, { top: insets.top + 12 }]}>
      {queue.map((t) => (
        <ToastView key={t.id} item={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </View>
  );
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translate, { toValue: -16, duration: 220, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, item.duration);
    return () => clearTimeout(timer);
  }, [item.duration, onDismiss, opacity, translate]);

  const cfg = configFor(item.variant);
  const Icon = cfg.icon;
  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY: translate }], borderColor: cfg.border }]}>
      <View style={styles.row}>
        <Pressable onPress={onDismiss} style={[styles.row, { flex: 1 }]}>
          <View style={[styles.iconWrap, { backgroundColor: cfg.iconBg }]}>
            <Icon size={16} color={cfg.iconColor} strokeWidth={2.4} />
          </View>
          <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
        </Pressable>
        {item.action ? (
          <Pressable
            onPress={() => { item.action?.onPress(); onDismiss(); }}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.actionTxt}>{item.action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

function configFor(variant: Variant) {
  switch (variant) {
    case 'success':
      return { icon: Check, iconColor: '#fff', iconBg: theme.colors.accent, border: theme.colors.accent };
    case 'error':
      return { icon: AlertCircle, iconColor: '#fff', iconBg: theme.colors.danger, border: theme.colors.danger };
    case 'warning':
      return { icon: AlertTriangle, iconColor: '#fff', iconBg: theme.colors.warn, border: theme.colors.warn };
    case 'info':
    default:
      return { icon: Info, iconColor: '#fff', iconBg: theme.colors.accentMuted, border: theme.colors.border };
  }
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 240,
    maxWidth: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
    lineHeight: 18,
  },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.pill,
    marginLeft: 8,
  },
  actionTxt: { color: theme.colors.accent, fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.xs },
});
