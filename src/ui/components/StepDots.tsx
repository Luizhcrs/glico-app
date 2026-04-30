// src/ui/components/StepDots.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => {
        const active = i + 1 === current;
        const done = i + 1 < current;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              active && styles.active,
              done && styles.done,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  active: { width: 24, backgroundColor: theme.colors.accent },
  done: { backgroundColor: theme.colors.accentMuted },
});
