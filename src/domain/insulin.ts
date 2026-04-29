// src/domain/insulin.ts
import type { DbLike } from '@/db/migrations';
import type { InsulinDose, InsulinType } from './types';

interface DbRow {
  id: number;
  units: number;
  insulin_type: string;
  insulin_brand: string | null;
  taken_at: number;
  measurement_id: number | null;
  note: string | null;
  created_at: number;
  deleted_at: number | null;
}

function toDomain(r: DbRow): InsulinDose {
  return {
    id: r.id,
    units: r.units,
    insulinType: r.insulin_type as InsulinType,
    insulinBrand: r.insulin_brand,
    takenAt: r.taken_at,
    measurementId: r.measurement_id,
    note: r.note,
    createdAt: r.created_at,
    deletedAt: r.deleted_at,
  };
}

export interface InsulinInput {
  units: number;
  insulinType: InsulinType;
  insulinBrand?: string | null;
  takenAt: number;
  measurementId?: number | null;
  note?: string | null;
}

export function insulinRepo(db: DbLike) {
  return {
    insert(i: InsulinInput): number {
      const r = db.run(
        `INSERT INTO insulin_dose (units, insulin_type, insulin_brand, taken_at, measurement_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [i.units, i.insulinType, i.insulinBrand ?? null, i.takenAt, i.measurementId ?? null, i.note ?? null, Date.now()],
      );
      return r.lastInsertRowid;
    },
    softDelete(id: number): void {
      db.run(`UPDATE insulin_dose SET deleted_at = ? WHERE id = ?`, [Date.now(), id]);
    },
    restore(id: number): void {
      db.run(`UPDATE insulin_dose SET deleted_at = NULL WHERE id = ?`, [id]);
    },
    listByDay(refTs: number): InsulinDose[] {
      const start = new Date(refTs); start.setHours(0, 0, 0, 0);
      const end = new Date(refTs); end.setHours(23, 59, 59, 999);
      const rows = db.all<DbRow>(
        `SELECT * FROM insulin_dose
         WHERE deleted_at IS NULL AND taken_at BETWEEN ? AND ?
         ORDER BY taken_at DESC`,
        [start.getTime(), end.getTime()],
      );
      return rows.map(toDomain);
    },
  };
}
