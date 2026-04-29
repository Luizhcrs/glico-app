// tests/integration/seed.test.ts
import Database from 'better-sqlite3';
import { runMigrations } from '@/db/migrations';
import { seedDefaults } from '@/db/seed';
import { adapt } from '../helpers/sqliteAdapter';

describe('seedDefaults', () => {
  it('inserts 6 default reminders only on first run', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    seedDefaults(db);
    expect(db.all(`SELECT id FROM reminder`).length).toBe(6);
    seedDefaults(db); // re-run
    expect(db.all(`SELECT id FROM reminder`).length).toBe(6);
  });
  it('keeps settings row at id=1', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    seedDefaults(db);
    const s = db.get<{ id: number; target_low: number }>(`SELECT id, target_low FROM settings WHERE id = 1`);
    expect(s?.id).toBe(1);
    expect(s?.target_low).toBe(70);
  });
});
