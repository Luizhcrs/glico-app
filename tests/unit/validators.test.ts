// tests/unit/validators.test.ts
import {
  validateMeasurement,
  validateInsulinUnits,
  isFutureTimestamp,
  needsConfirmation,
} from '@/domain/validators';

describe('validateMeasurement', () => {
  it('accepts value in [20, 600]', () => {
    expect(validateMeasurement(120).ok).toBe(true);
  });
  it('rejects below 20', () => {
    expect(validateMeasurement(19).ok).toBe(false);
  });
  it('rejects above 600', () => {
    expect(validateMeasurement(601).ok).toBe(false);
  });
  it('rejects non-integer', () => {
    expect(validateMeasurement(120.5).ok).toBe(false);
  });
});

describe('needsConfirmation', () => {
  it('flags <40', () => { expect(needsConfirmation(39)).toBe(true); });
  it('flags >500', () => { expect(needsConfirmation(501)).toBe(true); });
  it('does not flag 120', () => { expect(needsConfirmation(120)).toBe(false); });
});

describe('validateInsulinUnits', () => {
  it('accepts 0.5 step', () => {
    expect(validateInsulinUnits(0.5).ok).toBe(true);
    expect(validateInsulinUnits(2.0).ok).toBe(true);
    expect(validateInsulinUnits(2.5).ok).toBe(true);
  });
  it('rejects non 0.5 step', () => {
    expect(validateInsulinUnits(0.3).ok).toBe(false);
  });
  it('rejects negative', () => { expect(validateInsulinUnits(-1).ok).toBe(false); });
  it('rejects above 100', () => { expect(validateInsulinUnits(100.5).ok).toBe(false); });
});

describe('isFutureTimestamp', () => {
  it('false for now', () => {
    expect(isFutureTimestamp(Date.now())).toBe(false);
  });
  it('true for 6min ahead', () => {
    expect(isFutureTimestamp(Date.now() + 6 * 60_000)).toBe(true);
  });
  it('false for 4min ahead (within 5min slack)', () => {
    expect(isFutureTimestamp(Date.now() + 4 * 60_000)).toBe(false);
  });
});
