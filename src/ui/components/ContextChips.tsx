// src/ui/components/ContextChips.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';
import type { GlucoseContext } from '@/domain/types';

const LABELS: Record<GlucoseContext, string> = {
  fasting: 'Jejum',
  pre_meal: 'Pré-refeição',
  post_meal: 'Pós-refeição',
  bedtime: 'Antes de dormir',
  exercise: 'Exercício',
  hypo: 'Hipo',
  random: 'Aleatório',
};

export function ContextChips({
  value, onChange, options,
}: {
  value: GlucoseContext | null;
  onChange: (v: GlucoseContext) => void;
  options?: GlucoseContext[];
}) {
  const opts = options ?? (['fasting', 'pre_meal', 'post_meal', 'bedtime', 'exercise', 'random'] as GlucoseContext[]);
  return (
    <View style={styles.row}>
      {opts.map((o) => {
        const sel = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)} style={[styles.chip, sel && styles.chipSel]}>
            <Text style={[styles.txt, sel && styles.txtSel]}>{LABELS[o]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, justifyContent: 'center' },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSel: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  txt: { fontSize: theme.fontSizes.sm, color: theme.colors.text },
  txtSel: { color: '#fff', fontWeight: '600' },
});
