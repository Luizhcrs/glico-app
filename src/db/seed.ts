// src/db/seed.ts
import type { DbLike } from './migrations';

const DEFAULTS: Array<{ label: string; time: string; ctx: string }> = [
  { label: 'Jejum',         time: '07:00', ctx: 'fasting' },
  { label: 'Pré-almoço',    time: '12:00', ctx: 'pre_meal' },
  { label: 'Pós-almoço',    time: '14:00', ctx: 'post_meal' },
  { label: 'Pré-jantar',    time: '19:00', ctx: 'pre_meal' },
  { label: 'Pós-jantar',    time: '21:00', ctx: 'post_meal' },
  { label: 'Antes de dormir', time: '23:00', ctx: 'bedtime' },
];

export function seedDefaults(db: DbLike): void {
  const existing = db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM reminder`);
  if ((existing?.c ?? 0) > 0) return;
  const now = Date.now();
  for (const r of DEFAULTS) {
    db.run(
      `INSERT INTO reminder (label, time_of_day, context_hint, days_of_week, tolerance_minutes, enabled, created_at)
       VALUES (?, ?, ?, '1111111', 30, 1, ?)`,
      [r.label, r.time, r.ctx, now],
    );
  }
}
