// src/ui/components/BigNumber.tsx
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export function BigNumber({
  value,
  color,
  unit = 'mg/dL',
}: {
  value: number | string;
  color?: string;
  unit?: string | null;
}) {
  const numeric = typeof value === 'number' ? value : parseInt(value as string, 10);
  const isPlaceholder = !numeric || Number.isNaN(numeric);
  return (
    <View style={styles.wrap}>
      <Text style={[styles.num, color ? { color } : null, isPlaceholder && styles.muted]}>
        {isPlaceholder ? '—' : numeric}
      </Text>
      {unit && !isPlaceholder ? <Text style={[styles.unit, color ? { color } : null]}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  num: {
    fontSize: theme.fontSizes.hero,
    fontFamily: theme.fonts.extralight,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: theme.fontSizes.hero + 8,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.medium,
    marginBottom: 12,
  },
  muted: {
    color: theme.colors.textMuted,
    opacity: 0.4,
  },
});
