// tests/unit/migrations.test.ts
import Database from 'better-sqlite3';
import { runMigrations, getCurrentVersion } from '@/db/migrations';
import { adapt } from '../helpers/sqliteAdapter';

describe('migrations', () => {
  it('runs v1 on fresh db', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    expect(getCurrentVersion(db)).toBe(1);
    const row = raw.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='measurement'`).get();
    expect(row).toBeDefined();
  });

  it('is idempotent', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    runMigrations(db);
    expect(getCurrentVersion(db)).toBe(1);
  });
});
