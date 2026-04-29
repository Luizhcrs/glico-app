// src/ui/components/StatusPill.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export type Status = 'ok' | 'low' | 'high';

export function StatusPill({ status, label }: { status: Status; label?: string }) {
  const map = {
    ok:  { bg: theme.colors.pillOk,   fg: theme.colors.pillOkText,   text: 'no alvo' },
    low: { bg: theme.colors.pillLow,  fg: theme.colors.pillLowText,  text: 'hipo' },
    high:{ bg: theme.colors.pillHigh, fg: theme.colors.pillHighText, text: 'alto' },
  } as const;
  const m = map[status];
  return (
    <View style={[styles.pill, { backgroundColor: m.bg }]}>
      <Text style={[styles.txt, { color: m.fg }]}>{label ?? m.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    alignSelf: 'center',
  },
  txt: { fontSize: theme.fontSizes.xs, fontWeight: '600' },
});
