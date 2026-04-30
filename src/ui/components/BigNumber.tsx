// src/ui/components/BigNumber.tsx
import React, { useEffect, useRef, useState } from 'react';
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
  const [display, setDisplay] = useState(isPlaceholder ? 0 : numeric);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaceholder) { setDisplay(0); return; }
    const start = display;
    const target = numeric;
    if (start === target) return;
    const duration = 500;
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = Math.round(start + (target - start) * eased);
      setDisplay(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(tick) as unknown as number;
    };
    rafRef.current = requestAnimationFrame(tick) as unknown as number;
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeric, isPlaceholder]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.num, color ? { color } : null, isPlaceholder && styles.muted]}>
        {isPlaceholder ? '—' : display}
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
    fontWeight: '200',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: theme.fontSizes.hero + 8,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    fontWeight: '500',
    marginBottom: 12,
  },
  muted: {
    color: theme.colors.textMuted,
    opacity: 0.4,
  },
});
