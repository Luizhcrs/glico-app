// src/domain/measurement.ts
import type { DbLike } from '@/db/migrations';
import type { Measurement, GlucoseContext, MealLabel } from './types';

interface DbRow {
  id: number;
  value_mgdl: number;
  measured_at: number;
  context: string;
  meal_label: string | null;
  note: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

function toDomain(r: DbRow): Measurement {
  return {
    id: r.id,
    valueMgdl: r.value_mgdl,
    measuredAt: r.measured_at,
    context: r.context as GlucoseContext,
    mealLabel: (r.meal_label as MealLabel | null) ?? null,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

export interface MeasurementInput {
  valueMgdl: number;
  measuredAt: number;
  context: GlucoseContext;
  mealLabel?: MealLabel | null;
  note?: string | null;
}

export function measurementRepo(db: DbLike) {
  return {
    insert(input: MeasurementInput): number {
      const now = Date.now();
      const r = db.run(
        `INSERT INTO measurement (value_mgdl, measured_at, context, meal_label, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [input.valueMgdl, input.measuredAt, input.context, input.mealLabel ?? null, input.note ?? null, now, now],
      );
      return r.lastInsertRowid;
    },
    softDelete(id: number): void {
      db.run(`UPDATE measurement SET deleted_at = ? WHERE id = ?`, [Date.now(), id]);
    },
    restore(id: number): void {
      db.run(`UPDATE measurement SET deleted_at = NULL WHERE id = ?`, [id]);
    },
    listByDay(refTs: number): Measurement[] {
      const start = new Date(refTs); start.setHours(0, 0, 0, 0);
      const end = new Date(refTs); end.setHours(23, 59, 59, 999);
      return this.listInRange(start.getTime(), end.getTime());
    },
    listInRange(fromMs: number, toMs: number): Measurement[] {
      const rows = db.all<DbRow>(
        `SELECT * FROM measurement
         WHERE deleted_at IS NULL AND measured_at BETWEEN ? AND ?
         ORDER BY measured_at DESC`,
        [fromMs, toMs],
      );
      return rows.map(toDomain);
    },
    findById(id: number): Measurement | null {
      const r = db.get<DbRow>(`SELECT * FROM measurement WHERE id = ?`, [id]);
      return r ? toDomain(r) : null;
    },
    hasMeasurementInWindow(fromMs: number, toMs: number): boolean {
      const r = db.get<{ c: number }>(
        `SELECT COUNT(*) AS c FROM measurement
         WHERE deleted_at IS NULL AND measured_at BETWEEN ? AND ?`,
        [fromMs, toMs],
      );
      return (r?.c ?? 0) > 0;
    },
    latest(): Measurement | null {
      const r = db.get<DbRow>(
        `SELECT * FROM measurement WHERE deleted_at IS NULL ORDER BY measured_at DESC LIMIT 1`,
      );
      return r ? toDomain(r) : null;
    },
    previousBefore(ts: number): Measurement | null {
      const r = db.get<DbRow>(
        `SELECT * FROM measurement
         WHERE deleted_at IS NULL AND measured_at < ?
         ORDER BY measured_at DESC LIMIT 1`,
        [ts],
      );
      return r ? toDomain(r) : null;
    },
    update(id: number, patch: Partial<Pick<Measurement, 'valueMgdl' | 'context' | 'mealLabel' | 'note'>>): void {
      const cur = this.findById(id);
      if (!cur) return;
      db.run(
        `UPDATE measurement SET value_mgdl = ?, context = ?, meal_label = ?, note = ?, updated_at = ? WHERE id = ?`,
        [
          patch.valueMgdl ?? cur.valueMgdl,
          patch.context ?? cur.context,
          patch.mealLabel === undefined ? cur.mealLabel : patch.mealLabel,
          patch.note === undefined ? cur.note : patch.note,
          Date.now(),
          id,
        ],
      );
    },
  };
}
