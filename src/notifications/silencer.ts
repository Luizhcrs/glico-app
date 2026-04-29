import type { Measurement } from '@/domain/types';

export function shouldSilence(
  scheduledAtMs: number,
  toleranceMinutes: number,
  recent: Measurement[],
): boolean {
  const window = toleranceMinutes * 60_000;
  const from = scheduledAtMs - window;
  const to = scheduledAtMs + window;
  return recent.some((m) => m.measuredAt >= from && m.measuredAt <= to);
}
