import { shouldSilence } from '@/notifications/silencer';
import type { Measurement } from '@/domain/types';

function m(t: number): Measurement {
  return { id: 1, valueMgdl: 100, measuredAt: t, context: 'random', createdAt: t, updatedAt: t };
}

describe('shouldSilence', () => {
  const scheduled = new Date('2026-04-29T12:00:00').getTime();
  const tolerance = 30;
  it('silences if measurement inside ±tolerance', () => {
    const recent = [m(scheduled - 10 * 60_000)];
    expect(shouldSilence(scheduled, tolerance, recent)).toBe(true);
  });
  it('does not silence if outside window', () => {
    const recent = [m(scheduled - 60 * 60_000)];
    expect(shouldSilence(scheduled, tolerance, recent)).toBe(false);
  });
  it('handles empty list', () => {
    expect(shouldSilence(scheduled, tolerance, [])).toBe(false);
  });
});
