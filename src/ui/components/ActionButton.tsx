// src/ui/components/ActionButton.tsx
import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { theme } from '@/ui/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: LucideIcon;
}

export function ActionButton({ label, onPress, variant = 'primary', disabled, icon: Icon }: Props) {
  const v = variants[variant];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.row}>
        {Icon ? <Icon size={18} color={v.fg} strokeWidth={2.2} /> : null}
        <Text style={[styles.txt, { color: v.fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const variants = {
  primary: { bg: theme.colors.accent, fg: '#fff' },
  ghost:   { bg: theme.colors.cardBg, fg: theme.colors.text },
  danger:  { bg: theme.colors.danger, fg: '#fff' },
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txt: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.semibold,
    letterSpacing: 0.2,
  },
});
