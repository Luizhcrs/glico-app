// src/domain/types.ts
export type GlucoseContext =
  | 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'exercise' | 'hypo' | 'random';

export type MealLabel = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type InsulinType = 'basal' | 'bolus';

export type HypoTreatment = 'sugar' | 'juice' | 'glucagon' | 'food' | 'other';

export type HypoSymptom = 'tremor' | 'sweat' | 'dizziness' | 'hunger' | 'confusion' | 'irritability';

export type HypoCauseGuess =
  | 'too_much_insulin' | 'skipped_meal' | 'exercise' | 'alcohol' | 'unknown' | 'other';

export interface Measurement {
  id: number;
  valueMgdl: number;
  measuredAt: number;          // unix ms UTC
  context: GlucoseContext;
  mealLabel?: MealLabel | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface InsulinDose {
  id: number;
  units: number;               // step 0.5
  insulinType: InsulinType;
  insulinBrand?: string | null;
  takenAt: number;
  measurementId?: number | null;
  note?: string | null;
  createdAt: number;
  deletedAt?: number | null;
}

export interface HypoEvent {
  id: number;
  measurementId: number;
  symptoms: HypoSymptom[];
  treatment?: HypoTreatment | null;
  treatmentGrams?: number | null;
  recoveredAt?: number | null;
  recoveryValueMgdl?: number | null;
  causeGuess?: HypoCauseGuess | null;
  note?: string | null;
  createdAt: number;
}

export interface Reminder {
  id: number;
  label: string;
  timeOfDay: string;           // 'HH:MM'
  contextHint?: GlucoseContext | null;
  daysOfWeek: string;          // '1111111' (sun..sat)
  toleranceMinutes: number;
  enabled: boolean;
  createdAt: number;
}

export interface Settings {
  id: 1;
  displayName?: string | null;
  avatarUri?: string | null;
  diagnosisYear?: number | null;
  insulinMethod: 'pen' | 'pump';
  targetLow: number;
  targetHigh: number;
  hypoThreshold: number;
  severeHypoThreshold: number;
  hyperThreshold: number;
  unit: 'mgdl' | 'mmol';
  appLockEnabled: boolean;
  schemaVersion: number;
}
