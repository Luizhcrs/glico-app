// src/ui/components/Keypad.tsx
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Delete, Check } from 'lucide-react-native';
import { theme } from '@/ui/theme';

type KeyValue = { kind: 'digit'; v: string } | { kind: 'delete' } | { kind: 'confirm' };

const KEYS: KeyValue[] = [
  { kind: 'digit', v: '1' }, { kind: 'digit', v: '2' }, { kind: 'digit', v: '3' },
  { kind: 'digit', v: '4' }, { kind: 'digit', v: '5' }, { kind: 'digit', v: '6' },
  { kind: 'digit', v: '7' }, { kind: 'digit', v: '8' }, { kind: 'digit', v: '9' },
  { kind: 'delete' }, { kind: 'digit', v: '0' }, { kind: 'confirm' },
];

export function Keypad({
  value, onChange, onConfirm, maxLength = 3,
}: {
  value: string;
  onChange: (next: string) => void;
  onConfirm: () => void;
  maxLength?: number;
}) {
  const press = (k: KeyValue) => {
    if (k.kind === 'delete') return onChange(value.slice(0, -1));
    if (k.kind === 'confirm') return onConfirm();
    if (value.length >= maxLength) return;
    onChange(value + k.v);
  };

  return (
    <View style={styles.grid}>
      {KEYS.map((k, i) => {
        const isAction = k.kind !== 'digit';
        return (
          <Pressable
            key={i}
            onPress={() => press(k)}
            style={({ pressed }) => [
              styles.key,
              isAction && styles.keyAction,
              pressed && styles.keyPressed,
            ]}
          >
            {k.kind === 'digit' ? (
              <Text style={styles.txt}>{k.v}</Text>
            ) : k.kind === 'delete' ? (
              <Delete size={22} color={theme.colors.accent} strokeWidth={2} />
            ) : (
              <Check size={22} color={theme.colors.accent} strokeWidth={2.4} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, justifyContent: 'center' },
  key: {
    width: '31%',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    minHeight: 56,
  },
  keyAction: { backgroundColor: theme.colors.cardBg },
  keyPressed: { opacity: 0.6 },
  txt: { fontSize: theme.fontSizes.xl, fontFamily: theme.fonts.medium, color: theme.colors.text },
});
