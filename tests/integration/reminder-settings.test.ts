// tests/integration/reminder-settings.test.ts
import Database from 'better-sqlite3';
import { runMigrations } from '@/db/migrations';
import { seedDefaults } from '@/db/seed';
import { reminderRepo } from '@/domain/reminder';
import { settingsRepo } from '@/domain/settings';
import { adapt } from '../helpers/sqliteAdapter';

function setup() {
  const raw = new Database(':memory:');
  const db = adapt(raw);
  runMigrations(db);
  seedDefaults(db);
  return db;
}

describe('reminderRepo', () => {
  it('listEnabled returns only enabled', () => {
    const db = setup();
    const repo = reminderRepo(db);
    const all = repo.listAll();
    expect(all).toHaveLength(6);
    repo.setEnabled(all[0].id, false);
    expect(repo.listEnabled()).toHaveLength(5);
  });
  it('upsert updates time + label', () => {
    const db = setup();
    const repo = reminderRepo(db);
    const r = repo.listAll()[0];
    repo.update(r.id, { label: 'Café da manhã', timeOfDay: '06:30' });
    const updated = repo.findById(r.id);
    expect(updated?.label).toBe('Café da manhã');
    expect(updated?.timeOfDay).toBe('06:30');
  });
});

describe('settingsRepo', () => {
  it('getSingleton returns defaults after seed', () => {
    const db = setup();
    const s = settingsRepo(db).get();
    expect(s.targetLow).toBe(70);
    expect(s.targetHigh).toBe(180);
    expect(s.unit).toBe('mgdl');
  });
  it('update persists changes', () => {
    const db = setup();
    const repo = settingsRepo(db);
    repo.update({ displayName: 'Maria', targetHigh: 160 });
    const s = repo.get();
    expect(s.displayName).toBe('Maria');
    expect(s.targetHigh).toBe(160);
  });
});
