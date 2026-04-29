// src/ui/components/BigNumber.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export function BigNumber({ value, color }: { value: number | string; color?: string }) {
  return <Text style={[styles.txt, color ? { color } : null]}>{value}</Text>;
}

const styles = StyleSheet.create({
  txt: {
    fontSize: theme.fontSizes.hero,
    fontWeight: '300',
    color: theme.colors.text,
    textAlign: 'center',
  },
});
