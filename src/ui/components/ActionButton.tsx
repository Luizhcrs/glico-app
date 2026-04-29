// src/ui/components/ActionButton.tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export function ActionButton({
  label, onPress, variant = 'primary', disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const v = variants[variant];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.txt, { color: v.fg }]}>{label}</Text>
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
  },
  txt: { fontSize: theme.fontSizes.md, fontWeight: '600' },
});
