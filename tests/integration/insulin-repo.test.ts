// tests/integration/insulin-repo.test.ts
import Database from 'better-sqlite3';
import { runMigrations } from '@/db/migrations';
import { insulinRepo } from '@/domain/insulin';
import { adapt } from '../helpers/sqliteAdapter';

describe('insulinRepo', () => {
  it('insert + listByDay', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    const repo = insulinRepo(db);
    const t = Date.now();
    const id = repo.insert({ units: 4.5, insulinType: 'bolus', takenAt: t });
    expect(id).toBeGreaterThan(0);
    const list = repo.listByDay(t);
    expect(list[0].units).toBe(4.5);
  });

  it('softDelete excludes', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    const repo = insulinRepo(db);
    const id = repo.insert({ units: 10, insulinType: 'basal', takenAt: Date.now() });
    repo.softDelete(id);
    expect(repo.listByDay(Date.now())).toHaveLength(0);
  });
});
