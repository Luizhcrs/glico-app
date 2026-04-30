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

  it('countInRange counts events by created_at window', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    const repo = hypoRepo(db);
    const before = Date.now();
    repo.logHypo({ valueMgdl: 50, measuredAt: before, symptoms: [] });
    repo.logHypo({ valueMgdl: 55, measuredAt: before, symptoms: [] });
    repo.logHypo({ valueMgdl: 65, measuredAt: before, symptoms: [] });
    const after = Date.now();
    // Janela ampla cobre todos os 3
    expect(repo.countInRange(before - 1, after + 1)).toBe(3);
    // Janela no passado retorna 0
    expect(repo.countInRange(before - 7200_000, before - 1)).toBe(0);
    // Janela no futuro retorna 0
    expect(repo.countInRange(after + 10_000, after + 20_000)).toBe(0);
  });

  it('findById returns null for missing id', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    expect(hypoRepo(db).findById(999)).toBeNull();
  });

  it('findByMeasurementId returns null when none', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    expect(hypoRepo(db).findByMeasurementId(999)).toBeNull();
  });
});
