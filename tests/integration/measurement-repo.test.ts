// tests/integration/measurement-repo.test.ts
import Database from 'better-sqlite3';
import { runMigrations } from '@/db/migrations';
import { measurementRepo } from '@/domain/measurement';
import { adapt } from '../helpers/sqliteAdapter';

function setup() {
  const raw = new Database(':memory:');
  const db = adapt(raw);
  runMigrations(db);
  return { db, raw };
}

describe('measurementRepo', () => {
  it('insert + listByDay', () => {
    const { db } = setup();
    const repo = measurementRepo(db);
    const t0 = new Date('2026-04-29T10:00:00Z').getTime();
    const id = repo.insert({ valueMgdl: 142, measuredAt: t0, context: 'pre_meal', mealLabel: 'lunch' });
    expect(id).toBeGreaterThan(0);
    const list = repo.listByDay(t0);
    expect(list).toHaveLength(1);
    expect(list[0].valueMgdl).toBe(142);
  });

  it('soft delete excludes from list', () => {
    const { db } = setup();
    const repo = measurementRepo(db);
    const t0 = Date.now();
    const id = repo.insert({ valueMgdl: 100, measuredAt: t0, context: 'random' });
    repo.softDelete(id);
    expect(repo.listByDay(t0)).toHaveLength(0);
  });

  it('restore puts it back', () => {
    const { db } = setup();
    const repo = measurementRepo(db);
    const t0 = Date.now();
    const id = repo.insert({ valueMgdl: 100, measuredAt: t0, context: 'random' });
    repo.softDelete(id);
    repo.restore(id);
    expect(repo.listByDay(t0)).toHaveLength(1);
  });

  it('listInRange returns ordered DESC', () => {
    const { db } = setup();
    const repo = measurementRepo(db);
    const a = Date.now() - 60_000;
    const b = Date.now();
    repo.insert({ valueMgdl: 100, measuredAt: a, context: 'random' });
    repo.insert({ valueMgdl: 200, measuredAt: b, context: 'random' });
    const list = repo.listInRange(a - 1, b + 1);
    expect(list[0].valueMgdl).toBe(200);
    expect(list[1].valueMgdl).toBe(100);
  });

  it('hasMeasurementInWindow detects existing', () => {
    const { db } = setup();
    const repo = measurementRepo(db);
    const t = Date.now();
    repo.insert({ valueMgdl: 100, measuredAt: t, context: 'random' });
    expect(repo.hasMeasurementInWindow(t - 1000, t + 1000)).toBe(true);
    expect(repo.hasMeasurementInWindow(t + 5000, t + 10_000)).toBe(false);
  });
});
