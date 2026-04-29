// src/domain/stats.ts
import type { Measurement } from './types';

export interface ComputeStatsOpts {
  targetLow: number;
  targetHigh: number;
}

export interface Stats {
  tirPct: number;
  belowPct: number;
  abovePct: number;
  meanMgdl: number;
  stdDev: number;
  hypoCount: number;
  count: number;
}

export function computeStats(ms: Measurement[], o: ComputeStatsOpts): Stats {
  if (ms.length === 0) {
    return { tirPct: 0, belowPct: 0, abovePct: 0, meanMgdl: 0, stdDev: 0, hypoCount: 0, count: 0 };
  }
  const n = ms.length;
  let inRange = 0, below = 0, above = 0, sum = 0, hypoCount = 0;
  for (const m of ms) {
    sum += m.valueMgdl;
    if (m.valueMgdl < o.targetLow) below++;
    else if (m.valueMgdl > o.targetHigh) above++;
    else inRange++;
    if (m.valueMgdl < o.targetLow) hypoCount++;
  }
  const mean = sum / n;
  const variance = ms.reduce((acc, m) => acc + (m.valueMgdl - mean) ** 2, 0) / n;
  return {
    tirPct: Math.round((inRange / n) * 100),
    belowPct: Math.round((below / n) * 100),
    abovePct: Math.round((above / n) * 100),
    meanMgdl: Math.round(mean),
    stdDev: Math.round(Math.sqrt(variance)),
    hypoCount,
    count: n,
  };
}

export interface Bucket { count: number; mean: number; }

export interface ByTimeOfDay {
  morning: Bucket;     // 06-12
  afternoon: Bucket;   // 12-18
  evening: Bucket;     // 18-24
  night: Bucket;       // 00-06
}

function emptyBucket(): Bucket { return { count: 0, mean: 0 }; }

export function bucketByTimeOfDay(ms: Measurement[]): ByTimeOfDay {
  const buckets = {
    morning: { sum: 0, count: 0 },
    afternoon: { sum: 0, count: 0 },
    evening: { sum: 0, count: 0 },
    night: { sum: 0, count: 0 },
  };
  for (const m of ms) {
    const h = new Date(m.measuredAt).getHours();
    const k = h < 6 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    buckets[k].sum += m.valueMgdl;
    buckets[k].count += 1;
  }
  const out: ByTimeOfDay = {
    morning: emptyBucket(), afternoon: emptyBucket(), evening: emptyBucket(), night: emptyBucket(),
  };
  for (const k of Object.keys(buckets) as Array<keyof typeof buckets>) {
    out[k] = {
      count: buckets[k].count,
      mean: buckets[k].count === 0 ? 0 : Math.round(buckets[k].sum / buckets[k].count),
    };
  }
  return out;
}
