// src/domain/hypo.ts
import type { DbLike } from '@/db/migrations';
import type { HypoEvent, HypoSymptom, HypoTreatment, HypoCauseGuess } from './types';

interface DbRow {
  id: number;
  measurement_id: number;
  symptoms: string | null;
  treatment: string | null;
  treatment_grams: number | null;
  recovered_at: number | null;
  recovery_value_mgdl: number | null;
  cause_guess: string | null;
  note: string | null;
  created_at: number;
}

function toDomain(r: DbRow): HypoEvent {
  return {
    id: r.id,
    measurementId: r.measurement_id,
    symptoms: r.symptoms ? (JSON.parse(r.symptoms) as HypoSymptom[]) : [],
    treatment: r.treatment as HypoTreatment | null,
    treatmentGrams: r.treatment_grams,
    recoveredAt: r.recovered_at,
    recoveryValueMgdl: r.recovery_value_mgdl,
    causeGuess: r.cause_guess as HypoCauseGuess | null,
    note: r.note,
    createdAt: r.created_at,
  };
}

export interface HypoInput {
  valueMgdl: number;
  measuredAt: number;
  symptoms: HypoSymptom[];
  treatment?: HypoTreatment;
  treatmentGrams?: number;
  causeGuess?: HypoCauseGuess;
  note?: string;
}

export function hypoRepo(db: DbLike) {
  return {
    logHypo(input: HypoInput): { measurementId: number; hypoEventId: number } {
      const now = Date.now();
      const m = db.run(
        `INSERT INTO measurement (value_mgdl, measured_at, context, created_at, updated_at)
         VALUES (?, ?, 'hypo', ?, ?)`,
        [input.valueMgdl, input.measuredAt, now, now],
      );
      const measurementId = m.lastInsertRowid;
      const e = db.run(
        `INSERT INTO hypo_event (measurement_id, symptoms, treatment, treatment_grams, cause_guess, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          measurementId,
          JSON.stringify(input.symptoms),
          input.treatment ?? null,
          input.treatmentGrams ?? null,
          input.causeGuess ?? null,
          input.note ?? null,
          now,
        ],
      );
      return { measurementId, hypoEventId: e.lastInsertRowid };
    },
    markRecovery(hypoEventId: number, p: { recoveryValueMgdl: number; recoveredAt: number }): void {
      db.run(
        `UPDATE hypo_event SET recovery_value_mgdl = ?, recovered_at = ? WHERE id = ?`,
        [p.recoveryValueMgdl, p.recoveredAt, hypoEventId],
      );
    },
    findById(id: number): HypoEvent | null {
      const r = db.get<DbRow>(`SELECT * FROM hypo_event WHERE id = ?`, [id]);
      return r ? toDomain(r) : null;
    },
    findByMeasurementId(measurementId: number): HypoEvent | null {
      const r = db.get<DbRow>(`SELECT * FROM hypo_event WHERE measurement_id = ?`, [measurementId]);
      return r ? toDomain(r) : null;
    },
    countInRange(fromMs: number, toMs: number): number {
      const r = db.get<{ c: number }>(
        `SELECT COUNT(*) AS c FROM hypo_event
         WHERE created_at BETWEEN ? AND ?`,
        [fromMs, toMs],
      );
      return r?.c ?? 0;
    },
  };
}
