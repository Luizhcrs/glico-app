// src/ui/components/ContextChips.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChipProps {
  ctx: GlucoseContext;
  selected: boolean;
  onPress: () => void;
}

function Chip({ ctx, selected, onPress }: ChipProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={() => { onPress(); Haptics.selectionAsync().catch(() => {}); }}
      onPressIn={() => { scale.value = withTiming(0.95, { duration: 80 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
      style={[styles.chip, selected && styles.chipSel, animStyle]}
    >
      <Text style={[styles.txt, selected && styles.txtSel]}>{LABELS[ctx]}</Text>
    </AnimatedPressable>
  );
}

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
      {opts.map((o) => (
        <Chip key={o} ctx={o} selected={o === value} onPress={() => onChange(o)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSel: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  txt: { fontSize: theme.fontSizes.sm, color: theme.colors.text, fontWeight: '500' },
  txtSel: { color: '#fff', fontWeight: '600' },
});
