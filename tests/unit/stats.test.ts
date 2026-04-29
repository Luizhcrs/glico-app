// tests/unit/stats.test.ts
import { computeStats, bucketByTimeOfDay } from '@/domain/stats';
import type { Measurement } from '@/domain/types';

function m(value: number, hours: number): Measurement {
  const d = new Date('2026-04-29T00:00:00');
  d.setHours(hours);
  return {
    id: hours, valueMgdl: value, measuredAt: d.getTime(), context: 'random',
    createdAt: d.getTime(), updatedAt: d.getTime(),
  };
}

describe('computeStats', () => {
  it('TIR with bands [70, 180]', () => {
    const ms = [m(60, 8), m(100, 9), m(150, 10), m(200, 11)];
    const s = computeStats(ms, { targetLow: 70, targetHigh: 180 });
    expect(s.tirPct).toBe(50);
    expect(s.belowPct).toBe(25);
    expect(s.abovePct).toBe(25);
  });
  it('mean rounds to int', () => {
    const ms = [m(100, 8), m(200, 9), m(150, 10)];
    expect(computeStats(ms, { targetLow: 70, targetHigh: 180 }).meanMgdl).toBe(150);
  });
  it('counts hypo', () => {
    const ms = [m(60, 8), m(55, 9), m(100, 10)];
    const s = computeStats(ms, { targetLow: 70, targetHigh: 180 });
    expect(s.hypoCount).toBe(2);
  });
  it('handles empty', () => {
    const s = computeStats([], { targetLow: 70, targetHigh: 180 });
    expect(s.tirPct).toBe(0);
    expect(s.meanMgdl).toBe(0);
  });
});

describe('bucketByTimeOfDay', () => {
  it('groups morning/afternoon/evening', () => {
    const ms = [m(100, 8), m(150, 14), m(180, 22)];
    const b = bucketByTimeOfDay(ms);
    expect(b.morning.count).toBe(1);
    expect(b.afternoon.count).toBe(1);
    expect(b.evening.count).toBe(1);
    expect(b.morning.mean).toBe(100);
    expect(b.evening.mean).toBe(180);
  });
});
