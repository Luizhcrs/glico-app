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

  it('update preserves untouched fields', () => {
    const db = setup();
    const repo = reminderRepo(db);
    const r = repo.listAll()[0];
    repo.update(r.id, { label: 'Novo' });
    const updated = repo.findById(r.id);
    expect(updated?.label).toBe('Novo');
    expect(updated?.timeOfDay).toBe(r.timeOfDay);
    expect(updated?.toleranceMinutes).toBe(r.toleranceMinutes);
    expect(updated?.enabled).toBe(r.enabled);
  });

  it('update can toggle enabled to false explicitly', () => {
    const db = setup();
    const repo = reminderRepo(db);
    const r = repo.listAll()[0];
    repo.update(r.id, { enabled: false });
    expect(repo.findById(r.id)?.enabled).toBe(false);
  });

  it('update is no-op when id missing', () => {
    const db = setup();
    const repo = reminderRepo(db);
    expect(() => repo.update(999, { label: 'X' })).not.toThrow();
  });

  it('insert creates a new reminder with defaults', () => {
    const db = setup();
    const repo = reminderRepo(db);
    const initial = repo.listAll().length;
    const id = repo.insert({ label: 'Lanche', timeOfDay: '16:00' });
    expect(id).toBeGreaterThan(0);
    const all = repo.listAll();
    expect(all.length).toBe(initial + 1);
    const r = repo.findById(id)!;
    expect(r.daysOfWeek).toBe('1111111');
    expect(r.toleranceMinutes).toBe(30);
    expect(r.enabled).toBe(true);
  });

  it('delete removes the reminder permanently', () => {
    const db = setup();
    const repo = reminderRepo(db);
    const r = repo.listAll()[0];
    repo.delete(r.id);
    expect(repo.findById(r.id)).toBeNull();
    expect(repo.listAll().some((x) => x.id === r.id)).toBe(false);
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
