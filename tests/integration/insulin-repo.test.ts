// tests/integration/insulin-repo.test.ts
import Database from 'better-sqlite3';
import { runMigrations } from '@/db/migrations';
import { insulinRepo } from '@/domain/insulin';
import { adapt } from '../helpers/sqliteAdapter';

function setup() {
  const raw = new Database(':memory:');
  const db = adapt(raw);
  runMigrations(db);
  return db;
}

describe('insulinRepo', () => {
  it('insert + listByDay', () => {
    const db = setup();
    const repo = insulinRepo(db);
    const t = Date.now();
    const id = repo.insert({ units: 4.5, insulinType: 'bolus', takenAt: t });
    expect(id).toBeGreaterThan(0);
    const list = repo.listByDay(t);
    expect(list[0].units).toBe(4.5);
  });

  it('softDelete excludes', () => {
    const db = setup();
    const repo = insulinRepo(db);
    const id = repo.insert({ units: 10, insulinType: 'basal', takenAt: Date.now() });
    repo.softDelete(id);
    expect(repo.listByDay(Date.now())).toHaveLength(0);
  });

  it('restore returns dose to listByDay', () => {
    const db = setup();
    const repo = insulinRepo(db);
    const id = repo.insert({ units: 6, insulinType: 'bolus', takenAt: Date.now() });
    repo.softDelete(id);
    repo.restore(id);
    expect(repo.listByDay(Date.now())).toHaveLength(1);
  });

  it('lastBrandFor returns the most recent brand by type', () => {
    const db = setup();
    const repo = insulinRepo(db);
    const t = Date.now();
    repo.insert({ units: 4, insulinType: 'bolus', insulinBrand: 'NovoRapid', takenAt: t - 60_000 });
    repo.insert({ units: 5, insulinType: 'bolus', insulinBrand: 'Fiasp',      takenAt: t });
    repo.insert({ units: 18, insulinType: 'basal', insulinBrand: 'Basaglar',  takenAt: t });
    expect(repo.lastBrandFor('bolus')).toBe('Fiasp');
    expect(repo.lastBrandFor('basal')).toBe('Basaglar');
  });

  it('lastBrandFor ignores soft-deleted and entries without brand', () => {
    const db = setup();
    const repo = insulinRepo(db);
    const t = Date.now();
    const idA = repo.insert({ units: 4, insulinType: 'bolus', insulinBrand: 'Fiasp', takenAt: t });
    repo.insert({ units: 5, insulinType: 'bolus', takenAt: t + 1000 });
    repo.softDelete(idA);
    expect(repo.lastBrandFor('bolus')).toBeNull();
  });

  it('listByMeasurement returns linked doses ordered ASC', () => {
    const db = setup();
    // Cria 2 medições reais pra satisfazer FK do insulin_dose.measurement_id
    const t = Date.now();
    const mA = db.run(
      `INSERT INTO measurement (value_mgdl, measured_at, context, created_at, updated_at)
       VALUES (140, ?, 'pre_meal', ?, ?)`, [t, t, t],
    ).lastInsertRowid;
    const mB = db.run(
      `INSERT INTO measurement (value_mgdl, measured_at, context, created_at, updated_at)
       VALUES (200, ?, 'post_meal', ?, ?)`, [t, t, t],
    ).lastInsertRowid;
    const repo = insulinRepo(db);
    repo.insert({ units: 5, insulinType: 'bolus', takenAt: t,          measurementId: mA });
    repo.insert({ units: 1, insulinType: 'bolus', takenAt: t - 30_000, measurementId: mA });
    repo.insert({ units: 4, insulinType: 'bolus', takenAt: t,          measurementId: mB });
    const linked = repo.listByMeasurement(mA);
    expect(linked).toHaveLength(2);
    expect(linked[0].units).toBe(1);
    expect(linked[1].units).toBe(5);
  });

  it('averagePerDay computes total, count and avg by type', () => {
    const db = setup();
    const repo = insulinRepo(db);
    const now = Date.now();
    repo.insert({ units: 14, insulinType: 'basal', takenAt: now - 86_400_000 });
    repo.insert({ units: 16, insulinType: 'basal', takenAt: now - 1000 });
    repo.insert({ units: 5,  insulinType: 'bolus', takenAt: now });
    const basal = repo.averagePerDay(7, 'basal');
    expect(basal.doseCount).toBe(2);
    expect(basal.totalUnits).toBe(30);
    expect(basal.avgPerDay).toBeCloseTo(30 / 7, 1);
    const bolus = repo.averagePerDay(7, 'bolus');
    expect(bolus.doseCount).toBe(1);
  });

  it('averagePerDay returns zeros when no doses', () => {
    const db = setup();
    const repo = insulinRepo(db);
    const r = repo.averagePerDay(30, 'basal');
    expect(r.totalUnits).toBe(0);
    expect(r.doseCount).toBe(0);
    expect(r.avgPerDay).toBe(0);
  });
});
