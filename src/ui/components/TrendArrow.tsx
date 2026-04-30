// src/ui/components/TrendArrow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { theme } from '@/ui/theme';

export type Direction = 'up' | 'down' | 'flat';

export function TrendArrow({ delta }: { delta: number | null }) {
  if (delta == null) return null;
  const dir: Direction = Math.abs(delta) < 5 ? 'flat' : delta > 0 ? 'up' : 'down';
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
  const sign = delta > 0 ? '+' : '';
  return (
    <View style={styles.wrap}>
      <Icon size={12} color={theme.colors.textMuted} strokeWidth={2.4} />
      <Text style={styles.txt}>{sign}{Math.round(delta)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.cardBg,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: theme.radii.pill,
  },
  txt: {
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
