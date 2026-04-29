// src/ui/components/Keypad.tsx
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export function Keypad({
  value, onChange, onConfirm, maxLength = 3,
}: {
  value: string;
  onChange: (next: string) => void;
  onConfirm: () => void;
  maxLength?: number;
}) {
  const press = (k: string) => {
    if (k === '⌫') return onChange(value.slice(0, -1));
    if (k === '✓') return onConfirm();
    if (value.length >= maxLength) return;
    onChange(value + k);
  };
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
  return (
    <View style={styles.grid}>
      {keys.map((k) => (
        <Pressable key={k} style={styles.key} onPress={() => press(k)}>
          <Text style={styles.txt}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, justifyContent: 'center' },
  key: {
    width: '30%',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.cardBg,
    alignItems: 'center',
  },
  txt: { fontSize: theme.fontSizes.xl, fontWeight: '600', color: theme.colors.text },
});
