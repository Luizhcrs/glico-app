// src/db/schema.ts
export const SCHEMA_V1 = [
  `CREATE TABLE IF NOT EXISTS measurement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value_mgdl INTEGER NOT NULL,
    measured_at INTEGER NOT NULL,
    context TEXT NOT NULL,
    meal_label TEXT,
    note TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
  );`,
  `CREATE INDEX IF NOT EXISTS idx_measurement_at ON measurement(measured_at DESC);`,
  `CREATE TABLE IF NOT EXISTS insulin_dose (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    units REAL NOT NULL,
    insulin_type TEXT NOT NULL,
    insulin_brand TEXT,
    taken_at INTEGER NOT NULL,
    measurement_id INTEGER,
    note TEXT,
    created_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (measurement_id) REFERENCES measurement(id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_dose_at ON insulin_dose(taken_at DESC);`,
  `CREATE TABLE IF NOT EXISTS hypo_event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    measurement_id INTEGER NOT NULL,
    symptoms TEXT,
    treatment TEXT,
    treatment_grams REAL,
    recovered_at INTEGER,
    recovery_value_mgdl INTEGER,
    cause_guess TEXT,
    note TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (measurement_id) REFERENCES measurement(id)
  );`,
  `CREATE TABLE IF NOT EXISTS reminder (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    time_of_day TEXT NOT NULL,
    context_hint TEXT,
    days_of_week TEXT NOT NULL,
    tolerance_minutes INTEGER NOT NULL DEFAULT 30,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    display_name TEXT,
    avatar_uri TEXT,
    diagnosis_year INTEGER,
    insulin_method TEXT NOT NULL DEFAULT 'pen',
    target_low INTEGER NOT NULL DEFAULT 70,
    target_high INTEGER NOT NULL DEFAULT 180,
    hypo_threshold INTEGER NOT NULL DEFAULT 70,
    severe_hypo_threshold INTEGER NOT NULL DEFAULT 54,
    hyper_threshold INTEGER NOT NULL DEFAULT 250,
    unit TEXT NOT NULL DEFAULT 'mgdl',
    app_lock_enabled INTEGER NOT NULL DEFAULT 0,
    schema_version INTEGER NOT NULL DEFAULT 1
  );`,
];

export const CURRENT_SCHEMA_VERSION = 1;
