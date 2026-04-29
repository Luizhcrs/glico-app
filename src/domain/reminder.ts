// src/domain/reminder.ts
import type { DbLike } from '@/db/migrations';
import type { Reminder, GlucoseContext } from './types';

interface DbRow {
  id: number;
  label: string;
  time_of_day: string;
  context_hint: string | null;
  days_of_week: string;
  tolerance_minutes: number;
  enabled: number;
  created_at: number;
}

function toDomain(r: DbRow): Reminder {
  return {
    id: r.id,
    label: r.label,
    timeOfDay: r.time_of_day,
    contextHint: (r.context_hint as GlucoseContext | null) ?? null,
    daysOfWeek: r.days_of_week,
    toleranceMinutes: r.tolerance_minutes,
    enabled: r.enabled === 1,
    createdAt: r.created_at,
  };
}

export interface ReminderInput {
  label: string;
  timeOfDay: string;
  contextHint?: GlucoseContext | null;
  daysOfWeek?: string;
  toleranceMinutes?: number;
  enabled?: boolean;
}

export function reminderRepo(db: DbLike) {
  return {
    listAll(): Reminder[] {
      return db.all<DbRow>(`SELECT * FROM reminder ORDER BY time_of_day ASC`).map(toDomain);
    },
    listEnabled(): Reminder[] {
      return db.all<DbRow>(`SELECT * FROM reminder WHERE enabled = 1 ORDER BY time_of_day ASC`).map(toDomain);
    },
    findById(id: number): Reminder | null {
      const r = db.get<DbRow>(`SELECT * FROM reminder WHERE id = ?`, [id]);
      return r ? toDomain(r) : null;
    },
    insert(i: ReminderInput): number {
      const r = db.run(
        `INSERT INTO reminder (label, time_of_day, context_hint, days_of_week, tolerance_minutes, enabled, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          i.label,
          i.timeOfDay,
          i.contextHint ?? null,
          i.daysOfWeek ?? '1111111',
          i.toleranceMinutes ?? 30,
          i.enabled === false ? 0 : 1,
          Date.now(),
        ],
      );
      return r.lastInsertRowid;
    },
    update(id: number, patch: Partial<ReminderInput>): void {
      const cur = this.findById(id);
      if (!cur) return;
      db.run(
        `UPDATE reminder SET label = ?, time_of_day = ?, context_hint = ?, days_of_week = ?, tolerance_minutes = ?, enabled = ?
         WHERE id = ?`,
        [
          patch.label ?? cur.label,
          patch.timeOfDay ?? cur.timeOfDay,
          patch.contextHint ?? cur.contextHint,
          patch.daysOfWeek ?? cur.daysOfWeek,
          patch.toleranceMinutes ?? cur.toleranceMinutes,
          patch.enabled === undefined ? (cur.enabled ? 1 : 0) : patch.enabled ? 1 : 0,
          id,
        ],
      );
    },
    setEnabled(id: number, enabled: boolean): void {
      db.run(`UPDATE reminder SET enabled = ? WHERE id = ?`, [enabled ? 1 : 0, id]);
    },
    delete(id: number): void {
      db.run(`DELETE FROM reminder WHERE id = ?`, [id]);
    },
  };
}
