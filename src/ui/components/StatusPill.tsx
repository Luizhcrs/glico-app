// src/ui/components/StatusPill.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { theme } from '@/ui/theme';

export type Status = 'ok' | 'low' | 'high';

export function StatusPill({ status, label }: { status: Status; label?: string }) {
  const map = {
    ok:  { bg: theme.colors.pillOk,   fg: theme.colors.pillOkText,   text: 'no alvo' },
    low: { bg: theme.colors.pillLow,  fg: theme.colors.pillLowText,  text: 'hipoglicemia' },
    high:{ bg: theme.colors.pillHigh, fg: theme.colors.pillHighText, text: 'hiperglicemia' },
  } as const;
  const m = map[status];
  return (
    <Animated.View
      key={status}
      entering={ZoomIn.duration(280).springify().damping(16)}
      style={[styles.pill, { backgroundColor: m.bg }]}
    >
      <Text style={[styles.txt, { color: m.fg }]}>{label ?? m.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radii.pill,
    alignSelf: 'center',
  },
  txt: { fontSize: theme.fontSizes.xs, fontWeight: '700', letterSpacing: 0.3, textTransform: 'lowercase' },
});
