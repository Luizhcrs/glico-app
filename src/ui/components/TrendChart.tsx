// src/ui/components/TrendChart.tsx
//
// NOTE: victory-native v41+ replaced the old Victory* component family with a
// Skia-based renderer. The plan was authored against the v40 API
// (VictoryChart/VictoryLine/VictoryArea/VictoryAxis/VictoryTheme); those
// imports do not exist in the installed v41.20.2. We adapt to the new
// CartesianChart + Line + Area API while preserving the visual contract:
// a line chart of measurements with a filled target band between
// `targetLow` and `targetHigh` on the y-axis.
//
// Runtime peer deps required for victory-native v41:
//   - @shopify/react-native-skia
//   - react-native-reanimated
//   - react-native-gesture-handler
// Phase E must install/configure these before this component renders.
// Type-checking passes today because tsconfig has `skipLibCheck: true`.

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { CartesianChart, Line, Area } from 'victory-native';
import { theme } from '@/ui/theme';
import type { Measurement } from '@/domain/types';

type ChartDatum = {
  x: number;
  y: number;
  bandLow: number;
  bandHigh: number;
  [key: string]: number;
};

export function TrendChart({
  data, targetLow, targetHigh,
}: {
  data: Measurement[];
  targetLow: number;
  targetHigh: number;
}) {
  const w = Dimensions.get('window').width - 24;
  const sorted = [...data].sort((a, b) => a.measuredAt - b.measuredAt);
  const chartData: ChartDatum[] = sorted.map((m) => ({
    x: m.measuredAt,
    y: m.valueMgdl,
    bandLow: targetLow,
    bandHigh: targetHigh,
  }));

  return (
    <View style={[styles.wrap, { width: w }]}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['y', 'bandLow', 'bandHigh']}
        padding={{ top: 16, bottom: 36, left: 40, right: 16 }}
      >
        {({ points, chartBounds }) => (
          <>
            <Area
              points={points.bandHigh}
              y0={chartBounds.bottom}
              color={theme.colors.pillOk}
              opacity={0.4}
            />
            <Line
              points={points.y}
              color={theme.colors.accent}
              strokeWidth={2}
            />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    height: 220,
  },
});
