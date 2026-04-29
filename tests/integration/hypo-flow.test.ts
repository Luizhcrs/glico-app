// tests/integration/hypo-flow.test.ts
import Database from 'better-sqlite3';
import { runMigrations } from '@/db/migrations';
import { hypoRepo } from '@/domain/hypo';
import { measurementRepo } from '@/domain/measurement';
import { adapt } from '../helpers/sqliteAdapter';

describe('hypo flow', () => {
  it('logHypo creates measurement + hypo_event linked', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    const t = Date.now();
    const result = hypoRepo(db).logHypo({
      valueMgdl: 58,
      measuredAt: t,
      symptoms: ['tremor', 'sweat'],
      treatment: 'sugar',
      treatmentGrams: 15,
    });
    expect(result.measurementId).toBeGreaterThan(0);
    expect(result.hypoEventId).toBeGreaterThan(0);

    const m = measurementRepo(db).findById(result.measurementId);
    expect(m?.context).toBe('hypo');
    expect(m?.valueMgdl).toBe(58);

    const evt = hypoRepo(db).findByMeasurementId(result.measurementId);
    expect(evt?.symptoms).toEqual(['tremor', 'sweat']);
    expect(evt?.treatment).toBe('sugar');
  });

  it('markRecovery updates recovered_at + value', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    const repo = hypoRepo(db);
    const r = repo.logHypo({ valueMgdl: 55, measuredAt: Date.now(), symptoms: [] });
    repo.markRecovery(r.hypoEventId, { recoveryValueMgdl: 95, recoveredAt: Date.now() + 900_000 });
    const evt = repo.findById(r.hypoEventId);
    expect(evt?.recoveryValueMgdl).toBe(95);
    expect(evt?.recoveredAt).toBeGreaterThan(0);
  });
});
