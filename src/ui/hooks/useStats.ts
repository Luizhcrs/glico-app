// src/ui/hooks/useStats.ts
import { useMemo } from 'react';
import { computeStats } from '@/domain/stats';
import type { Measurement } from '@/domain/types';

export function useStats(data: Measurement[], targetLow: number, targetHigh: number) {
  return useMemo(() => computeStats(data, { targetLow, targetHigh }), [data, targetLow, targetHigh]);
}
