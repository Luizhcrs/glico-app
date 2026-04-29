// src/domain/validators.ts
export type Result = { ok: true } | { ok: false; reason: string };

export function validateMeasurement(value: number): Result {
  if (!Number.isInteger(value)) return { ok: false, reason: 'must be integer mg/dL' };
  if (value < 20) return { ok: false, reason: 'too low (<20)' };
  if (value > 600) return { ok: false, reason: 'too high (>600)' };
  return { ok: true };
}

export function needsConfirmation(value: number): boolean {
  return value < 40 || value > 500;
}

export function validateInsulinUnits(units: number): Result {
  if (units < 0) return { ok: false, reason: 'negative' };
  if (units > 100) return { ok: false, reason: 'above 100' };
  // step 0.5
  if (Math.round(units * 2) / 2 !== units) {
    return { ok: false, reason: 'must be in steps of 0.5' };
  }
  return { ok: true };
}

const FIVE_MIN = 5 * 60_000;
export function isFutureTimestamp(ts: number, now: number = Date.now()): boolean {
  return ts > now + FIVE_MIN;
}
