// src/domain/settings.ts
import type { DbLike } from '@/db/migrations';
import type { Settings } from './types';

interface DbRow {
  id: number;
  display_name: string | null;
  avatar_uri: string | null;
  diagnosis_year: number | null;
  insulin_method: string;
  target_low: number;
  target_high: number;
  hypo_threshold: number;
  severe_hypo_threshold: number;
  hyper_threshold: number;
  unit: string;
  app_lock_enabled: number;
  schema_version: number;
}

function toDomain(r: DbRow): Settings {
  return {
    id: 1,
    displayName: r.display_name,
    avatarUri: r.avatar_uri,
    diagnosisYear: r.diagnosis_year,
    insulinMethod: r.insulin_method as 'pen' | 'pump',
    targetLow: r.target_low,
    targetHigh: r.target_high,
    hypoThreshold: r.hypo_threshold,
    severeHypoThreshold: r.severe_hypo_threshold,
    hyperThreshold: r.hyper_threshold,
    unit: r.unit as 'mgdl' | 'mmol',
    appLockEnabled: r.app_lock_enabled === 1,
    schemaVersion: r.schema_version,
  };
}

export function settingsRepo(db: DbLike) {
  return {
    get(): Settings {
      const r = db.get<DbRow>(`SELECT * FROM settings WHERE id = 1`);
      if (!r) throw new Error('settings row missing — db not seeded');
      return toDomain(r);
    },
    update(patch: Partial<Omit<Settings, 'id' | 'schemaVersion'>>): void {
      const cur = this.get();
      const next = { ...cur, ...patch };
      db.run(
        `UPDATE settings SET
          display_name = ?, avatar_uri = ?, diagnosis_year = ?, insulin_method = ?,
          target_low = ?, target_high = ?, hypo_threshold = ?, severe_hypo_threshold = ?, hyper_threshold = ?,
          unit = ?, app_lock_enabled = ?
         WHERE id = 1`,
        [
          next.displayName ?? null,
          next.avatarUri ?? null,
          next.diagnosisYear ?? null,
          next.insulinMethod,
          next.targetLow,
          next.targetHigh,
          next.hypoThreshold,
          next.severeHypoThreshold,
          next.hyperThreshold,
          next.unit,
          next.appLockEnabled ? 1 : 0,
        ],
      );
    },
  };
}
