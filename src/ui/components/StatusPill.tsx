// src/ui/components/StatusPill.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, ArrowDown, ArrowUp } from 'lucide-react-native';
import { theme } from '@/ui/theme';

export type Status = 'ok' | 'low' | 'high';

export function StatusPill({ status, label }: { status: Status; label?: string }) {
  const map = {
    ok:  { bg: theme.colors.pillOk,   fg: theme.colors.pillOkText,   text: 'no alvo',       Icon: Check },
    low: { bg: theme.colors.pillLow,  fg: theme.colors.pillLowText,  text: 'hipoglicemia',  Icon: ArrowDown },
    high:{ bg: theme.colors.pillHigh, fg: theme.colors.pillHighText, text: 'hiperglicemia', Icon: ArrowUp },
  } as const;
  const m = map[status];
  const Icon = m.Icon;
  return (
    <View style={[styles.pill, { backgroundColor: m.bg }]}>
      <Icon size={12} color={m.fg} strokeWidth={2.6} />
      <Text style={[styles.txt, { color: m.fg }]}>{label ?? m.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radii.pill,
    alignSelf: 'center',
  },
  txt: {
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.3,
  },
});
