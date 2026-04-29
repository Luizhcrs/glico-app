# Glico Fast Logger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship MVP of Glico — a single-user Expo (React Native + TS) mobile app for fast glucose logging, smart reminders, hypo tracking, trend charts and PDF reports for type-1 diabetes patients using fingerstick + insulin pen.

**Architecture:** Offline-first single-device app. SQLite (encrypted in repose via SQLCipher key from secure-store) holds all domain data. Expo local notifications for reminders with measurement-window silencing. Deep links via expo-router. PDF generated on device via expo-print. Zero backend; backup is manual encrypted `.json`. Visual identity Sage Calm (verde sálvia + bege quente).

**Tech Stack:** Expo SDK + expo-router (TypeScript), expo-sqlite (plain), expo-notifications, victory-native, expo-print, expo-secure-store, react-native-quick-crypto for AES-GCM/PBKDF2, Jest for unit/integration, Maestro for E2E.

**Encryption-at-rest decision (deferred):** The spec asks for SQLite encrypted at rest. SQLCipher in Expo requires either ejecting to bare workflow or swapping to `@op-engineering/op-sqlite` (which carries native rebuild and OTA implications). To keep MVP shippable in 3-4 weeks the database stays unencrypted at rest in v0.1.0. The mitigation: app data lives only in the per-app sandbox (already protected by device-level FBE/FDE on iOS and Android), backups exported by the user are AES-256-GCM encrypted, and the optional app-lock will gate visual access. Migration to op-sqlite + SQLCipher is the first item of v0.2.0.

**Reference spec:** `docs/superpowers/specs/2026-04-29-glico-fast-logger-design.md`

---

## File Structure

```
glico-app/
├── app/                              # expo-router screens
│   ├── _layout.tsx                   # root stack, theme, db init guard
│   ├── index.tsx                     # Home
│   ├── log.tsx                       # Log measurement (deep-link target)
│   ├── hypo.tsx                      # Log hypo (red flow)
│   ├── insulin.tsx                   # Log insulin
│   ├── trend.tsx                     # Trend chart + stats
│   ├── profile/
│   │   ├── index.tsx                 # Profile home
│   │   ├── targets.tsx               # Edit target ranges
│   │   ├── reminders.tsx             # CRUD reminders
│   │   └── about.tsx                 # About + privacy text
│   └── onboarding/
│       ├── _layout.tsx
│       ├── welcome.tsx
│       ├── name.tsx
│       ├── targets.tsx
│       └── reminders.tsx
├── src/
│   ├── db/
│   │   ├── client.ts                 # open db, run migrations, expose db handle
│   │   ├── schema.ts                 # DDL string constants
│   │   ├── migrations.ts             # versioned runner
│   │   └── seed.ts                   # default reminders + settings on first boot
│   ├── domain/
│   │   ├── types.ts                  # all domain types
│   │   ├── validators.ts             # value-range, step, future-check
│   │   ├── measurement.ts            # repo: insert/list/softDelete/restore
│   │   ├── insulin.ts                # repo
│   │   ├── hypo.ts                   # repo + measurement linking
│   │   ├── reminder.ts               # repo
│   │   ├── settings.ts               # repo (single-row)
│   │   └── stats.ts                  # TIR / mean / hypoCount / byTimeOfDay
│   ├── notifications/
│   │   ├── scheduler.ts              # syncReminders → schedule local pushes
│   │   ├── silencer.ts               # shouldSilence(scheduledAt, tolerance)
│   │   └── deeplink.ts               # parse glico:// URL params
│   ├── crypto/
│   │   ├── keychain.ts               # secure-store wrapper, db key getOrCreate
│   │   └── backup.ts                 # AES-256-GCM + PBKDF2 encrypt/decrypt
│   ├── pdf/
│   │   └── report.ts                 # build HTML → expo-print PDF buffer
│   ├── ui/
│   │   ├── theme.ts                  # Sage Calm tokens
│   │   ├── components/
│   │   │   ├── BigNumber.tsx
│   │   │   ├── StatusPill.tsx
│   │   │   ├── ContextChips.tsx
│   │   │   ├── Keypad.tsx
│   │   │   ├── ActionButton.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   └── DayList.tsx
│   │   └── hooks/
│   │       ├── useMeasurements.ts
│   │       ├── useStats.ts
│   │       └── useSettings.ts
│   └── utils/
│       ├── time.ts
│       └── format.ts
├── tests/
│   ├── unit/                         # Jest tests for pure logic
│   ├── integration/                  # Jest tests for repos against in-memory sqlite
│   └── e2e/                          # Maestro YAML flows
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
└── jest.config.js
```

---

## Task 1: Bootstrap Expo project

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `jest.config.js`, `.gitignore` (already exists, will extend)

- [ ] **Step 1: Init Expo TS template**

```bash
cd /c/Users/luiz.rs/Documents/Projects/glico-app
npx create-expo-app@latest . --template blank-typescript --no-install
```

Expected: project files written into current directory. If prompted to overwrite README/.gitignore, accept; we will re-apply our `.gitignore` next.

- [ ] **Step 2: Re-apply our `.gitignore`**

The Expo template overwrites our `.gitignore`. Restore the project rules:

```
.superpowers/
node_modules/
.expo/
.expo-shared/
dist/
web-build/
*.log
.env
.env.local
.env.*.local
ios/Pods/
android/.gradle/
android/app/build/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
.DS_Store
.idea/
.vscode/
```

- [ ] **Step 3: Install runtime deps**

```bash
npx expo install expo-router expo-sqlite expo-notifications expo-secure-store expo-print expo-file-system expo-haptics expo-image-picker expo-localization react-native-svg
npm install victory-native react-native-quick-crypto
npm install date-fns
```

- [ ] **Step 4: Install dev deps**

```bash
npm install -D jest @types/jest jest-expo ts-jest @testing-library/react-native @testing-library/jest-native better-sqlite3 @types/better-sqlite3
```

`better-sqlite3` is used for unit/integration tests because expo-sqlite requires the native runtime. Tests will use a thin adapter behind the same interface.

- [ ] **Step 5: Configure expo-router in `app.json`**

Replace the `expo` block with:

```json
{
  "expo": {
    "name": "Glico",
    "slug": "glico",
    "version": "0.1.0",
    "orientation": "portrait",
    "scheme": "glico",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": { "supportsTablet": false, "bundleIdentifier": "com.luizhcrs.glico" },
    "android": { "package": "com.luizhcrs.glico" },
    "plugins": [
      "expo-router",
      "expo-notifications",
      "expo-secure-store",
      "expo-sqlite"
    ],
    "experiments": { "typedRoutes": true }
  }
}
```

- [ ] **Step 6: Configure `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 7: Configure `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))'
  ]
};
```

- [ ] **Step 8: Smoke check + commit**

```bash
npx tsc --noEmit
```

Expected: no errors (no source files yet).

```bash
git add -A
git commit -m "chore: bootstrap Expo TS project with expo-router and test deps"
```

---

## Task 2: Sage Calm theme tokens

**Files:**
- Create: `src/ui/theme.ts`

- [ ] **Step 1: Write theme module**

```ts
// src/ui/theme.ts
export const colors = {
  bg: '#f5f3ed',          // bege quente base
  surface: '#fff',
  cardBg: '#e8e4d8',
  text: '#2d3a2d',
  textMuted: '#6b7a6b',
  accent: '#5a7a5a',      // sálvia primário
  accentMuted: '#8aa68a',
  ok: '#5a7a5a',
  warn: '#b08a3a',
  danger: '#b22',         // hipo
  pillOk: '#d4e4d4',
  pillOkText: '#2d5a2d',
  pillLow: '#f5d8d8',
  pillLowText: '#8c1c1c',
  pillHigh: '#f7ead2',
  pillHighText: '#7a5a10',
  border: '#d8d4c8',
};

export const radii = { sm: 8, md: 12, lg: 16, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const fontSizes = { xs: 11, sm: 13, md: 15, lg: 18, xl: 24, hero: 56 };
export const fontWeights = { regular: '400' as const, medium: '500' as const, bold: '700' as const };

export type Theme = {
  colors: typeof colors;
  radii: typeof radii;
  spacing: typeof spacing;
  fontSizes: typeof fontSizes;
  fontWeights: typeof fontWeights;
};

export const theme: Theme = { colors, radii, spacing, fontSizes, fontWeights };
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/theme.ts
git commit -m "feat(theme): add Sage Calm tokens"
```

---

## Task 3: Domain types

**Files:**
- Create: `src/domain/types.ts`

- [ ] **Step 1: Write types file**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/domain/types.ts
git commit -m "feat(domain): add core types"
```

---

## Task 4: Validators (TDD)

**Files:**
- Create: `tests/unit/validators.test.ts`
- Create: `src/domain/validators.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/validators.test.ts
import {
  validateMeasurement,
  validateInsulinUnits,
  isFutureTimestamp,
  needsConfirmation,
} from '@/domain/validators';

describe('validateMeasurement', () => {
  it('accepts value in [20, 600]', () => {
    expect(validateMeasurement(120).ok).toBe(true);
  });
  it('rejects below 20', () => {
    expect(validateMeasurement(19).ok).toBe(false);
  });
  it('rejects above 600', () => {
    expect(validateMeasurement(601).ok).toBe(false);
  });
  it('rejects non-integer', () => {
    expect(validateMeasurement(120.5).ok).toBe(false);
  });
});

describe('needsConfirmation', () => {
  it('flags <40', () => { expect(needsConfirmation(39)).toBe(true); });
  it('flags >500', () => { expect(needsConfirmation(501)).toBe(true); });
  it('does not flag 120', () => { expect(needsConfirmation(120)).toBe(false); });
});

describe('validateInsulinUnits', () => {
  it('accepts 0.5 step', () => {
    expect(validateInsulinUnits(0.5).ok).toBe(true);
    expect(validateInsulinUnits(2.0).ok).toBe(true);
    expect(validateInsulinUnits(2.5).ok).toBe(true);
  });
  it('rejects non 0.5 step', () => {
    expect(validateInsulinUnits(0.3).ok).toBe(false);
  });
  it('rejects negative', () => { expect(validateInsulinUnits(-1).ok).toBe(false); });
  it('rejects above 100', () => { expect(validateInsulinUnits(100.5).ok).toBe(false); });
});

describe('isFutureTimestamp', () => {
  it('false for now', () => {
    expect(isFutureTimestamp(Date.now())).toBe(false);
  });
  it('true for 6min ahead', () => {
    expect(isFutureTimestamp(Date.now() + 6 * 60_000)).toBe(true);
  });
  it('false for 4min ahead (within 5min slack)', () => {
    expect(isFutureTimestamp(Date.now() + 4 * 60_000)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
npx jest tests/unit/validators.test.ts
```

Expected: FAIL "Cannot find module '@/domain/validators'".

- [ ] **Step 3: Implement validators**

```ts
// src/domain/validators.ts
export type Result = { ok: true } | { ok: false; reason: string };

export function validateMeasurement(value: number): Result {
  if (!Number.isInteger(value)) return { ok: false, reason: 'must be integer mg/dL' };
  if (value < 20) return { ok: false, reason: 'too low (<20)' };
  if (value > 600) return { ok: false, reason: 'too high (>600)' };
  return { ok: true };
}

export function needsConfirmation(value: number): boolean {
  return value < 40 || value > 500;
}

export function validateInsulinUnits(units: number): Result {
  if (units < 0) return { ok: false, reason: 'negative' };
  if (units > 100) return { ok: false, reason: 'above 100' };
  // step 0.5
  if (Math.round(units * 2) / 2 !== units) {
    return { ok: false, reason: 'must be in steps of 0.5' };
  }
  return { ok: true };
}

const FIVE_MIN = 5 * 60_000;
export function isFutureTimestamp(ts: number, now: number = Date.now()): boolean {
  return ts > now + FIVE_MIN;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npx jest tests/unit/validators.test.ts
```

Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/validators.ts tests/unit/validators.test.ts
git commit -m "feat(validators): value range, step, future-check with tests"
```

---

## Task 5: DB schema constants

**Files:**
- Create: `src/db/schema.ts`

- [ ] **Step 1: Write schema DDL**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat(db): schema v1 DDL constants"
```

---

## Task 6: Migrations runner (TDD)

**Files:**
- Create: `tests/unit/migrations.test.ts`
- Create: `src/db/migrations.ts`

- [ ] **Step 1: Failing test using better-sqlite3 as test driver**

```ts
// tests/unit/migrations.test.ts
import Database from 'better-sqlite3';
import { runMigrations, getCurrentVersion } from '@/db/migrations';
import { adapt } from '../helpers/sqliteAdapter';

describe('migrations', () => {
  it('runs v1 on fresh db', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    expect(getCurrentVersion(db)).toBe(1);
    const row = raw.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='measurement'`).get();
    expect(row).toBeDefined();
  });

  it('is idempotent', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    runMigrations(db);
    expect(getCurrentVersion(db)).toBe(1);
  });
});
```

- [ ] **Step 2: Add sqlite test adapter helper**

```ts
// tests/helpers/sqliteAdapter.ts
import type Database from 'better-sqlite3';

export interface DbLike {
  exec(sql: string): void;
  run(sql: string, params?: unknown[]): { lastInsertRowid: number; changes: number };
  get<T = unknown>(sql: string, params?: unknown[]): T | undefined;
  all<T = unknown>(sql: string, params?: unknown[]): T[];
}

export function adapt(raw: Database.Database): DbLike {
  return {
    exec: (sql) => { raw.exec(sql); },
    run: (sql, params = []) => {
      const r = raw.prepare(sql).run(...(params as unknown[]));
      return { lastInsertRowid: Number(r.lastInsertRowid), changes: r.changes };
    },
    get: (sql, params = []) => raw.prepare(sql).get(...(params as unknown[])) as never,
    all: (sql, params = []) => raw.prepare(sql).all(...(params as unknown[])) as never,
  };
}
```

- [ ] **Step 3: Run tests — fail with module not found**

```bash
npx jest tests/unit/migrations.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Implement migrations runner**

```ts
// src/db/migrations.ts
import { SCHEMA_V1, CURRENT_SCHEMA_VERSION } from './schema';

export interface DbLike {
  exec(sql: string): void;
  run(sql: string, params?: unknown[]): { lastInsertRowid: number; changes: number };
  get<T = unknown>(sql: string, params?: unknown[]): T | undefined;
  all<T = unknown>(sql: string, params?: unknown[]): T[];
}

export function getCurrentVersion(db: DbLike): number {
  try {
    const row = db.get<{ schema_version: number }>(`SELECT schema_version FROM settings WHERE id = 1`);
    return row?.schema_version ?? 0;
  } catch {
    return 0;
  }
}

export function runMigrations(db: DbLike): void {
  const v = getCurrentVersion(db);
  if (v < 1) {
    for (const stmt of SCHEMA_V1) db.exec(stmt);
    db.run(
      `INSERT OR IGNORE INTO settings (id, schema_version) VALUES (1, ?)`,
      [CURRENT_SCHEMA_VERSION],
    );
  }
  // future versions appended here
}
```

- [ ] **Step 5: Run tests, verify pass**

```bash
npx jest tests/unit/migrations.test.ts
```

Expected: PASS (2).

- [ ] **Step 6: Commit**

```bash
git add tests/helpers/ tests/unit/migrations.test.ts src/db/migrations.ts
git commit -m "feat(db): idempotent migrations runner with v1 schema"
```

---

## Task 7: DB client + seed (TDD)

**Files:**
- Create: `src/db/client.ts`
- Create: `src/db/seed.ts`
- Create: `tests/integration/seed.test.ts`

- [ ] **Step 1: Failing seed test**

```ts
// tests/integration/seed.test.ts
import Database from 'better-sqlite3';
import { runMigrations } from '@/db/migrations';
import { seedDefaults } from '@/db/seed';
import { adapt } from '../helpers/sqliteAdapter';

describe('seedDefaults', () => {
  it('inserts 6 default reminders only on first run', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    seedDefaults(db);
    expect(db.all(`SELECT id FROM reminder`).length).toBe(6);
    seedDefaults(db); // re-run
    expect(db.all(`SELECT id FROM reminder`).length).toBe(6);
  });
  it('keeps settings row at id=1', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    seedDefaults(db);
    const s = db.get<{ id: number; target_low: number }>(`SELECT id, target_low FROM settings WHERE id = 1`);
    expect(s?.id).toBe(1);
    expect(s?.target_low).toBe(70);
  });
});
```

- [ ] **Step 2: Run — fail**

```bash
npx jest tests/integration/seed.test.ts
```

Expected: FAIL "Cannot find module '@/db/seed'".

- [ ] **Step 3: Implement seed + client**

```ts
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
```

```ts
// src/db/client.ts
import * as SQLite from 'expo-sqlite';
import { runMigrations, type DbLike } from './migrations';
import { seedDefaults } from './seed';

let _db: SQLite.SQLiteDatabase | null = null;

function asDbLike(d: SQLite.SQLiteDatabase): DbLike {
  return {
    exec: (sql) => { d.execSync(sql); },
    run: (sql, params = []) => {
      const r = d.runSync(sql, params as never);
      return { lastInsertRowid: Number(r.lastInsertRowId ?? 0), changes: r.changes };
    },
    get: (sql, params = []) => d.getFirstSync<never>(sql, params as never) ?? undefined,
    all: (sql, params = []) => d.getAllSync<never>(sql, params as never) as never,
  };
}

export async function openDb(): Promise<DbLike> {
  if (_db) return asDbLike(_db);
  _db = await SQLite.openDatabaseAsync('glico.db');
  const db = asDbLike(_db);
  runMigrations(db);
  seedDefaults(db);
  return db;
}

export function getDbSync(): DbLike {
  if (!_db) throw new Error('db not opened — call openDb first');
  return asDbLike(_db);
}
```

- [ ] **Step 4: Run tests pass**

```bash
npx jest tests/integration/seed.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/client.ts src/db/seed.ts tests/integration/seed.test.ts
git commit -m "feat(db): client open + idempotent seed of 6 default reminders"
```

---

## Task 8: Measurement repo (TDD)

**Files:**
- Create: `src/domain/measurement.ts`
- Create: `tests/integration/measurement-repo.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// tests/integration/measurement-repo.test.ts
import Database from 'better-sqlite3';
import { runMigrations } from '@/db/migrations';
import { measurementRepo } from '@/domain/measurement';
import { adapt } from '../helpers/sqliteAdapter';

function setup() {
  const raw = new Database(':memory:');
  const db = adapt(raw);
  runMigrations(db);
  return { db, raw };
}

describe('measurementRepo', () => {
  it('insert + listByDay', () => {
    const { db } = setup();
    const repo = measurementRepo(db);
    const t0 = new Date('2026-04-29T10:00:00Z').getTime();
    const id = repo.insert({ valueMgdl: 142, measuredAt: t0, context: 'pre_meal', mealLabel: 'lunch' });
    expect(id).toBeGreaterThan(0);
    const list = repo.listByDay(t0);
    expect(list).toHaveLength(1);
    expect(list[0].valueMgdl).toBe(142);
  });

  it('soft delete excludes from list', () => {
    const { db } = setup();
    const repo = measurementRepo(db);
    const t0 = Date.now();
    const id = repo.insert({ valueMgdl: 100, measuredAt: t0, context: 'random' });
    repo.softDelete(id);
    expect(repo.listByDay(t0)).toHaveLength(0);
  });

  it('restore puts it back', () => {
    const { db } = setup();
    const repo = measurementRepo(db);
    const t0 = Date.now();
    const id = repo.insert({ valueMgdl: 100, measuredAt: t0, context: 'random' });
    repo.softDelete(id);
    repo.restore(id);
    expect(repo.listByDay(t0)).toHaveLength(1);
  });

  it('listInRange returns ordered DESC', () => {
    const { db } = setup();
    const repo = measurementRepo(db);
    const a = Date.now() - 60_000;
    const b = Date.now();
    repo.insert({ valueMgdl: 100, measuredAt: a, context: 'random' });
    repo.insert({ valueMgdl: 200, measuredAt: b, context: 'random' });
    const list = repo.listInRange(a - 1, b + 1);
    expect(list[0].valueMgdl).toBe(200);
    expect(list[1].valueMgdl).toBe(100);
  });

  it('hasMeasurementInWindow detects existing', () => {
    const { db } = setup();
    const repo = measurementRepo(db);
    const t = Date.now();
    repo.insert({ valueMgdl: 100, measuredAt: t, context: 'random' });
    expect(repo.hasMeasurementInWindow(t - 1000, t + 1000)).toBe(true);
    expect(repo.hasMeasurementInWindow(t + 5000, t + 10_000)).toBe(false);
  });
});
```

- [ ] **Step 2: Run — fail**

```bash
npx jest tests/integration/measurement-repo.test.ts
```

- [ ] **Step 3: Implement repo**

```ts
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
  };
}
```

- [ ] **Step 4: Run — pass**

```bash
npx jest tests/integration/measurement-repo.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/measurement.ts tests/integration/measurement-repo.test.ts
git commit -m "feat(domain): measurement repo with soft delete and window query"
```

---

## Task 9: Insulin repo (TDD)

**Files:**
- Create: `src/domain/insulin.ts`
- Create: `tests/integration/insulin-repo.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/integration/insulin-repo.test.ts
import Database from 'better-sqlite3';
import { runMigrations } from '@/db/migrations';
import { insulinRepo } from '@/domain/insulin';
import { adapt } from '../helpers/sqliteAdapter';

describe('insulinRepo', () => {
  it('insert + listByDay', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    const repo = insulinRepo(db);
    const t = Date.now();
    const id = repo.insert({ units: 4.5, insulinType: 'bolus', takenAt: t });
    expect(id).toBeGreaterThan(0);
    const list = repo.listByDay(t);
    expect(list[0].units).toBe(4.5);
  });

  it('softDelete excludes', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    const repo = insulinRepo(db);
    const id = repo.insert({ units: 10, insulinType: 'basal', takenAt: Date.now() });
    repo.softDelete(id);
    expect(repo.listByDay(Date.now())).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Implement**

```ts
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
```

- [ ] **Step 3: Run tests pass + commit**

```bash
npx jest tests/integration/insulin-repo.test.ts
git add src/domain/insulin.ts tests/integration/insulin-repo.test.ts
git commit -m "feat(domain): insulin dose repo"
```

---

## Task 10: Hypo repo with measurement linking (TDD)

**Files:**
- Create: `src/domain/hypo.ts`
- Create: `tests/integration/hypo-flow.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/integration/hypo-flow.test.ts
import Database from 'better-sqlite3';
import { runMigrations } from '@/db/migrations';
import { hypoRepo } from '@/domain/hypo';
import { measurementRepo } from '@/domain/measurement';
import { adapt } from '../helpers/sqliteAdapter';

describe('hypo flow', () => {
  it('logHypo creates measurement + hypo_event linked', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    const t = Date.now();
    const result = hypoRepo(db).logHypo({
      valueMgdl: 58,
      measuredAt: t,
      symptoms: ['tremor', 'sweat'],
      treatment: 'sugar',
      treatmentGrams: 15,
    });
    expect(result.measurementId).toBeGreaterThan(0);
    expect(result.hypoEventId).toBeGreaterThan(0);

    const m = measurementRepo(db).findById(result.measurementId);
    expect(m?.context).toBe('hypo');
    expect(m?.valueMgdl).toBe(58);

    const evt = hypoRepo(db).findByMeasurementId(result.measurementId);
    expect(evt?.symptoms).toEqual(['tremor', 'sweat']);
    expect(evt?.treatment).toBe('sugar');
  });

  it('markRecovery updates recovered_at + value', () => {
    const raw = new Database(':memory:');
    const db = adapt(raw);
    runMigrations(db);
    const repo = hypoRepo(db);
    const r = repo.logHypo({ valueMgdl: 55, measuredAt: Date.now(), symptoms: [] });
    repo.markRecovery(r.hypoEventId, { recoveryValueMgdl: 95, recoveredAt: Date.now() + 900_000 });
    const evt = repo.findById(r.hypoEventId);
    expect(evt?.recoveryValueMgdl).toBe(95);
    expect(evt?.recoveredAt).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Implement**

```ts
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
```

- [ ] **Step 3: Pass + commit**

```bash
npx jest tests/integration/hypo-flow.test.ts
git add src/domain/hypo.ts tests/integration/hypo-flow.test.ts
git commit -m "feat(domain): hypo repo with paired measurement insert"
```

---

## Task 11: Reminder + Settings repos

**Files:**
- Create: `src/domain/reminder.ts`
- Create: `src/domain/settings.ts`
- Create: `tests/integration/reminder-settings.test.ts`

- [ ] **Step 1: Failing tests**

```ts
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
```

- [ ] **Step 2: Implement reminder repo**

```ts
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
```

- [ ] **Step 3: Implement settings repo**

```ts
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
```

- [ ] **Step 4: Pass + commit**

```bash
npx jest tests/integration/reminder-settings.test.ts
git add src/domain/reminder.ts src/domain/settings.ts tests/integration/reminder-settings.test.ts
git commit -m "feat(domain): reminder + settings repos"
```

---

## Task 12: Stats (TIR, mean, hypo count, by-time-of-day) (TDD)

**Files:**
- Create: `src/domain/stats.ts`
- Create: `tests/unit/stats.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// tests/unit/stats.test.ts
import { computeStats, bucketByTimeOfDay } from '@/domain/stats';
import type { Measurement } from '@/domain/types';

function m(value: number, hours: number): Measurement {
  const d = new Date('2026-04-29T00:00:00');
  d.setHours(hours);
  return {
    id: hours, valueMgdl: value, measuredAt: d.getTime(), context: 'random',
    createdAt: d.getTime(), updatedAt: d.getTime(),
  };
}

describe('computeStats', () => {
  it('TIR with bands [70, 180]', () => {
    const ms = [m(60, 8), m(100, 9), m(150, 10), m(200, 11)];
    const s = computeStats(ms, { targetLow: 70, targetHigh: 180 });
    expect(s.tirPct).toBe(50);
    expect(s.belowPct).toBe(25);
    expect(s.abovePct).toBe(25);
  });
  it('mean rounds to int', () => {
    const ms = [m(100, 8), m(200, 9), m(150, 10)];
    expect(computeStats(ms, { targetLow: 70, targetHigh: 180 }).meanMgdl).toBe(150);
  });
  it('counts hypo', () => {
    const ms = [m(60, 8), m(55, 9), m(100, 10)];
    const s = computeStats(ms, { targetLow: 70, targetHigh: 180 });
    expect(s.hypoCount).toBe(2);
  });
  it('handles empty', () => {
    const s = computeStats([], { targetLow: 70, targetHigh: 180 });
    expect(s.tirPct).toBe(0);
    expect(s.meanMgdl).toBe(0);
  });
});

describe('bucketByTimeOfDay', () => {
  it('groups morning/afternoon/night', () => {
    const ms = [m(100, 8), m(150, 14), m(180, 22)];
    const b = bucketByTimeOfDay(ms);
    expect(b.morning.count).toBe(1);
    expect(b.afternoon.count).toBe(1);
    expect(b.night.count).toBe(1);
    expect(b.morning.mean).toBe(100);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/domain/stats.ts
import type { Measurement } from './types';

export interface ComputeStatsOpts {
  targetLow: number;
  targetHigh: number;
}

export interface Stats {
  tirPct: number;
  belowPct: number;
  abovePct: number;
  meanMgdl: number;
  stdDev: number;
  hypoCount: number;
  count: number;
}

export function computeStats(ms: Measurement[], o: ComputeStatsOpts): Stats {
  if (ms.length === 0) {
    return { tirPct: 0, belowPct: 0, abovePct: 0, meanMgdl: 0, stdDev: 0, hypoCount: 0, count: 0 };
  }
  const n = ms.length;
  let inRange = 0, below = 0, above = 0, sum = 0, hypoCount = 0;
  for (const m of ms) {
    sum += m.valueMgdl;
    if (m.valueMgdl < o.targetLow) below++;
    else if (m.valueMgdl > o.targetHigh) above++;
    else inRange++;
    if (m.valueMgdl < o.targetLow) hypoCount++;
  }
  const mean = sum / n;
  const variance = ms.reduce((acc, m) => acc + (m.valueMgdl - mean) ** 2, 0) / n;
  return {
    tirPct: Math.round((inRange / n) * 100),
    belowPct: Math.round((below / n) * 100),
    abovePct: Math.round((above / n) * 100),
    meanMgdl: Math.round(mean),
    stdDev: Math.round(Math.sqrt(variance)),
    hypoCount,
    count: n,
  };
}

export interface Bucket { count: number; mean: number; }

export interface ByTimeOfDay {
  morning: Bucket;     // 06-12
  afternoon: Bucket;   // 12-18
  evening: Bucket;     // 18-24
  night: Bucket;       // 00-06
}

function emptyBucket(): Bucket { return { count: 0, mean: 0 }; }

export function bucketByTimeOfDay(ms: Measurement[]): ByTimeOfDay {
  const buckets = {
    morning: { sum: 0, count: 0 },
    afternoon: { sum: 0, count: 0 },
    evening: { sum: 0, count: 0 },
    night: { sum: 0, count: 0 },
  };
  for (const m of ms) {
    const h = new Date(m.measuredAt).getHours();
    const k = h < 6 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    buckets[k].sum += m.valueMgdl;
    buckets[k].count += 1;
  }
  const out: ByTimeOfDay = {
    morning: emptyBucket(), afternoon: emptyBucket(), evening: emptyBucket(), night: emptyBucket(),
  };
  for (const k of Object.keys(buckets) as Array<keyof typeof buckets>) {
    out[k] = {
      count: buckets[k].count,
      mean: buckets[k].count === 0 ? 0 : Math.round(buckets[k].sum / buckets[k].count),
    };
  }
  return out;
}
```

NOTE: the test calls `b.night` for hour 22 expecting count 1 — fix: hour 22 falls in `evening` per the function. Update test:

Update `tests/unit/stats.test.ts` "groups morning/afternoon/night" to:
```ts
expect(b.evening.count).toBe(1);
expect(b.evening.mean).toBe(180);
```
And remove the `night.count` assertion. (Solo edit before running.)

- [ ] **Step 3: Run + commit**

```bash
npx jest tests/unit/stats.test.ts
git add src/domain/stats.ts tests/unit/stats.test.ts
git commit -m "feat(stats): TIR + mean + std-dev + hypo count + buckets"
```

---

## Task 13: Notification silencer (TDD)

**Files:**
- Create: `src/notifications/silencer.ts`
- Create: `tests/unit/silencer.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/silencer.test.ts
import { shouldSilence } from '@/notifications/silencer';
import type { Measurement } from '@/domain/types';

function m(t: number): Measurement {
  return { id: 1, valueMgdl: 100, measuredAt: t, context: 'random', createdAt: t, updatedAt: t };
}

describe('shouldSilence', () => {
  const scheduled = new Date('2026-04-29T12:00:00').getTime();
  const tolerance = 30;
  it('silences if measurement inside ±tolerance', () => {
    const recent = [m(scheduled - 10 * 60_000)];
    expect(shouldSilence(scheduled, tolerance, recent)).toBe(true);
  });
  it('does not silence if outside window', () => {
    const recent = [m(scheduled - 60 * 60_000)];
    expect(shouldSilence(scheduled, tolerance, recent)).toBe(false);
  });
  it('handles empty list', () => {
    expect(shouldSilence(scheduled, tolerance, [])).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/notifications/silencer.ts
import type { Measurement } from '@/domain/types';

export function shouldSilence(
  scheduledAtMs: number,
  toleranceMinutes: number,
  recent: Measurement[],
): boolean {
  const window = toleranceMinutes * 60_000;
  const from = scheduledAtMs - window;
  const to = scheduledAtMs + window;
  return recent.some((m) => m.measuredAt >= from && m.measuredAt <= to);
}
```

- [ ] **Step 3: Run + commit**

```bash
npx jest tests/unit/silencer.test.ts
git add src/notifications/silencer.ts tests/unit/silencer.test.ts
git commit -m "feat(notifications): silencer with ±tolerance window"
```

---

## Task 14: Notification scheduler

**Files:**
- Create: `src/notifications/scheduler.ts`

- [ ] **Step 1: Implement scheduler**

```ts
// src/notifications/scheduler.ts
import * as Notifications from 'expo-notifications';
import type { Reminder } from '@/domain/types';

const TAG_PREFIX = 'glico-reminder-';

function tagFor(reminderId: number): string {
  return `${TAG_PREFIX}${reminderId}`;
}

function parseHHMM(s: string): { hour: number; minute: number } {
  const [h, m] = s.split(':').map((x) => parseInt(x, 10));
  return { hour: h, minute: m };
}

export async function ensurePermissions(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

export async function syncReminders(reminders: Reminder[]): Promise<void> {
  // cancel all existing glico-* schedules
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of all) {
    if (typeof item.identifier === 'string' && item.identifier.startsWith(TAG_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
  for (const r of reminders) {
    if (!r.enabled) continue;
    const { hour, minute } = parseHHMM(r.timeOfDay);
    await Notifications.scheduleNotificationAsync({
      identifier: tagFor(r.id),
      content: {
        title: 'Glico',
        body: `Hora de medir: ${r.label}`,
        data: { reminderId: r.id, contextHint: r.contextHint, deepLink: buildDeepLink(r) },
      },
      trigger: { hour, minute, repeats: true },
    });
  }
}

function buildDeepLink(r: Reminder): string {
  const params = new URLSearchParams();
  if (r.contextHint) params.set('context', r.contextHint);
  return `glico://log?${params.toString()}`;
}

export async function scheduleHypoFollowUp(measuredAt: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `glico-hypo-followup-${measuredAt}`,
    content: {
      title: 'Glico',
      body: 'Mede de novo (regra dos 15)',
      data: { deepLink: 'glico://log?context=hypo' },
    },
    trigger: { seconds: 15 * 60 },
  });
}

export async function snoozeReminder(reminderId: number, minutes: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `${TAG_PREFIX}${reminderId}-snooze-${Date.now()}`,
    content: {
      title: 'Glico',
      body: 'Lembrete adiado',
      data: { reminderId },
    },
    trigger: { seconds: minutes * 60 },
  });
}
```

- [ ] **Step 2: Commit (no unit test for native scheduler — covered in E2E)**

```bash
git add src/notifications/scheduler.ts
git commit -m "feat(notifications): local scheduler with sync + hypo follow-up + snooze"
```

---

## Task 15: Deep link parser (TDD)

**Files:**
- Create: `src/notifications/deeplink.ts`
- Create: `tests/unit/deeplink.test.ts`

- [ ] **Step 1: Test**

```ts
// tests/unit/deeplink.test.ts
import { parseLogDeepLink } from '@/notifications/deeplink';

describe('parseLogDeepLink', () => {
  it('parses context + meal', () => {
    expect(parseLogDeepLink('glico://log?context=pre_meal&meal=lunch'))
      .toEqual({ context: 'pre_meal', mealLabel: 'lunch' });
  });
  it('returns empty for malformed', () => {
    expect(parseLogDeepLink('garbage')).toEqual({});
  });
  it('only context', () => {
    expect(parseLogDeepLink('glico://log?context=hypo'))
      .toEqual({ context: 'hypo' });
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/notifications/deeplink.ts
import type { GlucoseContext, MealLabel } from '@/domain/types';

const VALID_CONTEXTS: GlucoseContext[] = ['fasting', 'pre_meal', 'post_meal', 'bedtime', 'exercise', 'hypo', 'random'];
const VALID_MEALS: MealLabel[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface LogDeepLink {
  context?: GlucoseContext;
  mealLabel?: MealLabel;
}

export function parseLogDeepLink(url: string): LogDeepLink {
  const out: LogDeepLink = {};
  let qs: string | undefined;
  const idx = url.indexOf('?');
  if (idx === -1) return out;
  qs = url.slice(idx + 1);
  const params = new URLSearchParams(qs);
  const ctx = params.get('context');
  if (ctx && (VALID_CONTEXTS as string[]).includes(ctx)) out.context = ctx as GlucoseContext;
  const meal = params.get('meal');
  if (meal && (VALID_MEALS as string[]).includes(meal)) out.mealLabel = meal as MealLabel;
  return out;
}
```

- [ ] **Step 3: Run + commit**

```bash
npx jest tests/unit/deeplink.test.ts
git add src/notifications/deeplink.ts tests/unit/deeplink.test.ts
git commit -m "feat(notifications): deep link parser with whitelist"
```

---

## Task 16: Crypto — keychain wrapper

**Files:**
- Create: `src/crypto/keychain.ts`

- [ ] **Step 1: Implement**

```ts
// src/crypto/keychain.ts
import * as SecureStore from 'expo-secure-store';
import { randomBytes } from 'react-native-quick-crypto';

const DB_KEY_NAME = 'glico.db.key';
const PIN_KEY_NAME = 'glico.app.pin';

export async function getOrCreateDbKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DB_KEY_NAME);
  if (existing) return existing;
  const buf = randomBytes(32);
  const hex = Buffer.from(buf).toString('hex');
  await SecureStore.setItemAsync(DB_KEY_NAME, hex, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
  return hex;
}

export async function setAppPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY_NAME, pin, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function verifyAppPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY_NAME);
  return stored === pin;
}

export async function hasAppPin(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY_NAME);
  return stored !== null;
}

export async function clearAppPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY_NAME);
}
```

- [ ] **Step 2: Commit (manual exercise of secure-store on device, no unit test)**

```bash
git add src/crypto/keychain.ts
git commit -m "feat(crypto): keychain wrappers for db key and app PIN"
```

---

## Task 17: Backup encrypt/decrypt (TDD)

**Files:**
- Create: `src/crypto/backup.ts`
- Create: `tests/integration/backup-roundtrip.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/integration/backup-roundtrip.test.ts
import { encryptBackup, decryptBackup } from '@/crypto/backup';

describe('backup roundtrip', () => {
  it('encrypts and decrypts JSON payload', async () => {
    const payload = { measurements: [{ id: 1, valueMgdl: 142 }], settings: { displayName: 'Maria' } };
    const password = 'correct horse battery staple';
    const blob = await encryptBackup(payload, password);
    expect(typeof blob).toBe('string');
    const restored = await decryptBackup(blob, password);
    expect(restored).toEqual(payload);
  });
  it('rejects wrong password', async () => {
    const blob = await encryptBackup({ x: 1 }, 'pass1');
    await expect(decryptBackup(blob, 'pass2')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/crypto/backup.ts
import { pbkdf2, createCipheriv, createDecipheriv, randomBytes } from 'react-native-quick-crypto';

const VERSION = 'glico-bk-v1';
const ITER = 600_000;
const KEY_LEN = 32;
const IV_LEN = 12;
const SALT_LEN = 16;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, ITER, KEY_LEN, 'sha256', (err: Error | null, key: Buffer) => {
      if (err) reject(err); else resolve(key);
    });
  });
}

export async function encryptBackup(payload: unknown, password: string): Promise<string> {
  const salt = Buffer.from(randomBytes(SALT_LEN));
  const iv = Buffer.from(randomBytes(IV_LEN));
  const key = await deriveKey(password, salt);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, salt.toString('base64'), iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join('.');
}

export async function decryptBackup(blob: string, password: string): Promise<unknown> {
  const parts = blob.split('.');
  if (parts.length !== 5 || parts[0] !== VERSION) throw new Error('invalid backup format');
  const salt = Buffer.from(parts[1], 'base64');
  const iv = Buffer.from(parts[2], 'base64');
  const tag = Buffer.from(parts[3], 'base64');
  const ciphertext = Buffer.from(parts[4], 'base64');
  const key = await deriveKey(password, salt);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}
```

NOTE: react-native-quick-crypto in Jest may need polyfill via setup file. If `pbkdf2` is unavailable in test runtime, mock with node `crypto`:

```ts
// jest.setup.cjs
jest.mock('react-native-quick-crypto', () => require('crypto'));
```

Add `setupFiles: ['<rootDir>/jest.setup.cjs']` to `jest.config.js`.

- [ ] **Step 3: Run + commit**

```bash
npx jest tests/integration/backup-roundtrip.test.ts
git add src/crypto/backup.ts tests/integration/backup-roundtrip.test.ts jest.setup.cjs jest.config.js
git commit -m "feat(crypto): AES-256-GCM backup with PBKDF2-SHA256 (600k iter)"
```

---

## Task 18: UI atoms — BigNumber, StatusPill, ContextChips, ActionButton

**Files:**
- Create: `src/ui/components/BigNumber.tsx`
- Create: `src/ui/components/StatusPill.tsx`
- Create: `src/ui/components/ContextChips.tsx`
- Create: `src/ui/components/ActionButton.tsx`

- [ ] **Step 1: BigNumber**

```tsx
// src/ui/components/BigNumber.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export function BigNumber({ value, color }: { value: number | string; color?: string }) {
  return <Text style={[styles.txt, color ? { color } : null]}>{value}</Text>;
}

const styles = StyleSheet.create({
  txt: {
    fontSize: theme.fontSizes.hero,
    fontWeight: '300',
    color: theme.colors.text,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: StatusPill**

```tsx
// src/ui/components/StatusPill.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export type Status = 'ok' | 'low' | 'high';

export function StatusPill({ status, label }: { status: Status; label?: string }) {
  const map = {
    ok:  { bg: theme.colors.pillOk,   fg: theme.colors.pillOkText,   text: 'no alvo' },
    low: { bg: theme.colors.pillLow,  fg: theme.colors.pillLowText,  text: 'hipo' },
    high:{ bg: theme.colors.pillHigh, fg: theme.colors.pillHighText, text: 'alto' },
  } as const;
  const m = map[status];
  return (
    <View style={[styles.pill, { backgroundColor: m.bg }]}>
      <Text style={[styles.txt, { color: m.fg }]}>{label ?? m.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    alignSelf: 'center',
  },
  txt: { fontSize: theme.fontSizes.xs, fontWeight: '600' },
});
```

- [ ] **Step 3: ContextChips**

```tsx
// src/ui/components/ContextChips.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';
import type { GlucoseContext } from '@/domain/types';

const LABELS: Record<GlucoseContext, string> = {
  fasting: 'Jejum',
  pre_meal: 'Pré-refeição',
  post_meal: 'Pós-refeição',
  bedtime: 'Antes de dormir',
  exercise: 'Exercício',
  hypo: 'Hipo',
  random: 'Aleatório',
};

export function ContextChips({
  value, onChange, options,
}: {
  value: GlucoseContext | null;
  onChange: (v: GlucoseContext) => void;
  options?: GlucoseContext[];
}) {
  const opts = options ?? (['fasting', 'pre_meal', 'post_meal', 'bedtime', 'exercise', 'random'] as GlucoseContext[]);
  return (
    <View style={styles.row}>
      {opts.map((o) => {
        const sel = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)} style={[styles.chip, sel && styles.chipSel]}>
            <Text style={[styles.txt, sel && styles.txtSel]}>{LABELS[o]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, justifyContent: 'center' },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSel: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  txt: { fontSize: theme.fontSizes.sm, color: theme.colors.text },
  txtSel: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 4: ActionButton**

```tsx
// src/ui/components/ActionButton.tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export function ActionButton({
  label, onPress, variant = 'primary', disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const v = variants[variant];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.txt, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
}

const variants = {
  primary: { bg: theme.colors.accent, fg: '#fff' },
  ghost:   { bg: theme.colors.cardBg, fg: theme.colors.text },
  danger:  { bg: theme.colors.danger, fg: '#fff' },
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
  },
  txt: { fontSize: theme.fontSizes.md, fontWeight: '600' },
});
```

- [ ] **Step 5: Type-check + commit**

```bash
npx tsc --noEmit
git add src/ui/components/
git commit -m "feat(ui): atoms BigNumber, StatusPill, ContextChips, ActionButton"
```

---

## Task 19: UI atoms — Keypad numeric input

**Files:**
- Create: `src/ui/components/Keypad.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/ui/components/Keypad.tsx
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export function Keypad({
  value, onChange, onConfirm, maxLength = 3,
}: {
  value: string;
  onChange: (next: string) => void;
  onConfirm: () => void;
  maxLength?: number;
}) {
  const press = (k: string) => {
    if (k === '⌫') return onChange(value.slice(0, -1));
    if (k === '✓') return onConfirm();
    if (value.length >= maxLength) return;
    onChange(value + k);
  };
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
  return (
    <View style={styles.grid}>
      {keys.map((k) => (
        <Pressable key={k} style={styles.key} onPress={() => press(k)}>
          <Text style={styles.txt}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, justifyContent: 'center' },
  key: {
    width: '30%',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.cardBg,
    alignItems: 'center',
  },
  txt: { fontSize: theme.fontSizes.xl, fontWeight: '600', color: theme.colors.text },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/components/Keypad.tsx
git commit -m "feat(ui): numeric keypad component"
```

---

## Task 20: Trend chart component

**Files:**
- Create: `src/ui/components/TrendChart.tsx`

- [ ] **Step 1: Implement (victory-native + bands)**

```tsx
// src/ui/components/TrendChart.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryAxis, VictoryLine, VictoryArea, VictoryTheme } from 'victory-native';
import { theme } from '@/ui/theme';
import type { Measurement } from '@/domain/types';

export function TrendChart({
  data, targetLow, targetHigh,
}: {
  data: Measurement[];
  targetLow: number;
  targetHigh: number;
}) {
  const points = data.map((m) => ({ x: new Date(m.measuredAt), y: m.valueMgdl }));
  const w = Dimensions.get('window').width - 24;
  return (
    <View style={[styles.wrap, { width: w }]}>
      <VictoryChart theme={VictoryTheme.material} width={w} height={220}
        padding={{ top: 16, bottom: 36, left: 40, right: 16 }}>
        <VictoryAxis tickFormat={() => ''} style={{ axis: { stroke: theme.colors.border } }} />
        <VictoryAxis dependentAxis style={{ axis: { stroke: theme.colors.border } }} />
        <VictoryArea
          data={[{ x: points[0]?.x ?? new Date(), y: targetHigh }, { x: points[points.length-1]?.x ?? new Date(), y: targetHigh }]}
          y0={() => targetLow}
          style={{ data: { fill: theme.colors.pillOk, opacity: 0.4 } }}
        />
        <VictoryLine data={points} style={{ data: { stroke: theme.colors.accent, strokeWidth: 2 } }} />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.sm },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/components/TrendChart.tsx
git commit -m "feat(ui): trend chart with target band"
```

---

## Task 21: UI hooks (useMeasurements, useStats, useSettings)

**Files:**
- Create: `src/ui/hooks/useMeasurements.ts`
- Create: `src/ui/hooks/useStats.ts`
- Create: `src/ui/hooks/useSettings.ts`

- [ ] **Step 1: Implement hooks**

```ts
// src/ui/hooks/useMeasurements.ts
import { useEffect, useState, useCallback } from 'react';
import { getDbSync } from '@/db/client';
import { measurementRepo } from '@/domain/measurement';
import type { Measurement } from '@/domain/types';

export function useMeasurementsInRange(fromMs: number, toMs: number) {
  const [data, setData] = useState<Measurement[]>([]);
  const reload = useCallback(() => {
    setData(measurementRepo(getDbSync()).listInRange(fromMs, toMs));
  }, [fromMs, toMs]);
  useEffect(() => { reload(); }, [reload]);
  return { data, reload };
}

export function useLatestMeasurement() {
  const [data, setData] = useState<Measurement | null>(null);
  const reload = useCallback(() => {
    setData(measurementRepo(getDbSync()).latest());
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, reload };
}
```

```ts
// src/ui/hooks/useStats.ts
import { useMemo } from 'react';
import { computeStats } from '@/domain/stats';
import type { Measurement } from '@/domain/types';

export function useStats(data: Measurement[], targetLow: number, targetHigh: number) {
  return useMemo(() => computeStats(data, { targetLow, targetHigh }), [data, targetLow, targetHigh]);
}
```

```ts
// src/ui/hooks/useSettings.ts
import { useEffect, useState, useCallback } from 'react';
import { getDbSync } from '@/db/client';
import { settingsRepo } from '@/domain/settings';
import type { Settings } from '@/domain/types';

export function useSettings() {
  const [data, setData] = useState<Settings | null>(null);
  const reload = useCallback(() => {
    setData(settingsRepo(getDbSync()).get());
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, reload };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/hooks/
git commit -m "feat(hooks): measurement, stats, settings"
```

---

## Task 22: Root layout + DB init guard

**Files:**
- Create: `app/_layout.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { openDb } from '@/db/client';
import { theme } from '@/ui/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => { openDb().then(() => setReady(true)); }, []);
  if (!ready) {
    return <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: theme.colors.bg }}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>;
  }
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: theme.colors.bg },
      headerTitleStyle: { color: theme.colors.text },
      contentStyle: { backgroundColor: theme.colors.bg },
    }} />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(app): root layout with db init guard"
```

---

## Task 23: Home screen

**Files:**
- Create: `app/index.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/index.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useLatestMeasurement, useMeasurementsInRange } from '@/ui/hooks/useMeasurements';
import { useSettings } from '@/ui/hooks/useSettings';
import { BigNumber } from '@/ui/components/BigNumber';
import { StatusPill, type Status } from '@/ui/components/StatusPill';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function statusFor(value: number, low: number, high: number): Status {
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'ok';
}

export default function HomeScreen() {
  const { data: settings } = useSettings();
  const { data: latest } = useLatestMeasurement();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const { data: today } = useMeasurementsInRange(todayStart.getTime(), todayEnd.getTime());

  if (!settings) return null;
  const name = settings.displayName ?? 'Olá';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Olá, {name}</Text>
      {latest ? (
        <>
          <Text style={styles.subtle}>
            Última medição há {format(new Date(latest.measuredAt), "HH:mm 'de' dd/MM", { locale: ptBR })}
          </Text>
          <BigNumber value={latest.valueMgdl} />
          <StatusPill status={statusFor(latest.valueMgdl, settings.targetLow, settings.targetHigh)} />
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>Nenhuma medição registrada ainda</Text>
        </View>
      )}

      <View style={styles.actions}>
        <ActionButton label="+ Medir" onPress={() => router.push('/log')} />
        <View style={{ width: 12 }} />
        <ActionButton label="Hipo" variant="danger" onPress={() => router.push('/hypo')} />
      </View>
      <View style={{ height: 8 }} />
      <ActionButton label="+ Insulina" variant="ghost" onPress={() => router.push('/insulin')} />

      <Text style={styles.section}>Hoje</Text>
      {today.length === 0 ? <Text style={styles.subtle}>Sem medições hoje</Text> :
        today.map((m) => (
          <View key={m.id} style={styles.row}>
            <Text style={styles.rowLabel}>{format(new Date(m.measuredAt), 'HH:mm')} · {m.context}</Text>
            <Text style={styles.rowValue}>{m.valueMgdl}</Text>
          </View>
        ))
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  greeting: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.text },
  subtle: { color: theme.colors.textMuted, fontSize: theme.fontSizes.sm, textAlign: 'center' },
  actions: { flexDirection: 'row', marginTop: theme.spacing.lg },
  section: { marginTop: theme.spacing.lg, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderColor: theme.colors.border },
  rowLabel: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  rowValue: { color: theme.colors.accent, fontSize: theme.fontSizes.md, fontWeight: '700' },
  empty: { alignItems: 'center', padding: theme.spacing.xl },
  emptyTxt: { color: theme.colors.textMuted },
});
```

ActionButton's flex behavior must be wrapped — adjust ActionButton style: in `ActionButton.tsx` styles add `flex:1` is undesirable. We will wrap the two-button row in flex containers:

- [ ] **Step 2: Adjust action row to flex correctly**

Replace the `<View style={styles.actions}>` block in `app/index.tsx` with:

```tsx
<View style={styles.actions}>
  <View style={{ flex: 1 }}><ActionButton label="+ Medir" onPress={() => router.push('/log')} /></View>
  <View style={{ width: 12 }} />
  <View style={{ flex: 1 }}><ActionButton label="Hipo" variant="danger" onPress={() => router.push('/hypo')} /></View>
</View>
```

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat(home): greet + latest + today list with action buttons"
```

---

## Task 24: Log measurement screen (deep-link target)

**Files:**
- Create: `app/log.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/log.tsx
import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { measurementRepo } from '@/domain/measurement';
import { getDbSync } from '@/db/client';
import { validateMeasurement, needsConfirmation } from '@/domain/validators';
import { useSettings } from '@/ui/hooks/useSettings';
import { BigNumber } from '@/ui/components/BigNumber';
import { StatusPill, type Status } from '@/ui/components/StatusPill';
import { ContextChips } from '@/ui/components/ContextChips';
import { Keypad } from '@/ui/components/Keypad';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import type { GlucoseContext, MealLabel } from '@/domain/types';

function statusFor(v: number, low: number, high: number): Status {
  if (v < low) return 'low'; if (v > high) return 'high'; return 'ok';
}

export default function LogScreen() {
  const params = useLocalSearchParams<{ context?: string; meal?: string }>();
  const initialContext = (params.context as GlucoseContext) ?? 'random';
  const { data: settings } = useSettings();
  const [value, setValue] = useState('');
  const [context, setContext] = useState<GlucoseContext>(initialContext);

  if (!settings) return null;
  const numeric = value === '' ? 0 : parseInt(value, 10);

  const submit = () => {
    const v = parseInt(value, 10);
    const valid = validateMeasurement(v);
    if (!valid.ok) { Alert.alert('Valor inválido', valid.reason); return; }
    const persist = () => {
      measurementRepo(getDbSync()).insert({
        valueMgdl: v,
        measuredAt: Date.now(),
        context,
        mealLabel: (params.meal as MealLabel) ?? null,
      });
      router.replace('/');
    };
    if (needsConfirmation(v)) {
      Alert.alert('Tem certeza desse valor?', `${v} mg/dL é incomum. Confirma?`, [
        { text: 'Cancelar' },
        { text: 'Confirmar', onPress: persist },
      ]);
    } else {
      persist();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nova medição</Text>
      <BigNumber value={numeric || '–'} />
      {numeric > 0 && (
        <StatusPill status={statusFor(numeric, settings.targetLow, settings.targetHigh)} />
      )}
      <View style={{ height: theme.spacing.md }} />
      <ContextChips value={context} onChange={setContext} />
      <View style={{ height: theme.spacing.md }} />
      <Keypad value={value} onChange={setValue} onConfirm={submit} />
      <View style={{ height: theme.spacing.md }} />
      <ActionButton label="Salvar" onPress={submit} disabled={!value} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  title: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/log.tsx
git commit -m "feat(log): measurement entry with deep-link context, confirm modal for outliers"
```

---

## Task 25: Hypo screen

**Files:**
- Create: `app/hypo.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/hypo.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { hypoRepo } from '@/domain/hypo';
import { getDbSync } from '@/db/client';
import { scheduleHypoFollowUp } from '@/notifications/scheduler';
import { Keypad } from '@/ui/components/Keypad';
import { BigNumber } from '@/ui/components/BigNumber';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import { validateMeasurement } from '@/domain/validators';
import type { HypoSymptom, HypoTreatment } from '@/domain/types';

const SYMPTOMS: { key: HypoSymptom; label: string }[] = [
  { key: 'tremor', label: 'Tremor' }, { key: 'sweat', label: 'Suor' },
  { key: 'dizziness', label: 'Tontura' }, { key: 'hunger', label: 'Fome' },
  { key: 'confusion', label: 'Confusão' }, { key: 'irritability', label: 'Irritabilidade' },
];
const TREATMENTS: { key: HypoTreatment; label: string }[] = [
  { key: 'sugar', label: 'Açúcar 15g' }, { key: 'juice', label: 'Suco' },
  { key: 'food', label: 'Comida' }, { key: 'glucagon', label: 'Glucagon' }, { key: 'other', label: 'Outro' },
];

export default function HypoScreen() {
  const [value, setValue] = useState('');
  const [symptoms, setSymptoms] = useState<HypoSymptom[]>([]);
  const [treatment, setTreatment] = useState<HypoTreatment | null>(null);

  const toggle = (s: HypoSymptom) => {
    setSymptoms((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  };

  const submit = async () => {
    const v = parseInt(value, 10);
    if (!validateMeasurement(v).ok) { Alert.alert('Valor inválido'); return; }
    hypoRepo(getDbSync()).logHypo({
      valueMgdl: v,
      measuredAt: Date.now(),
      symptoms,
      treatment: treatment ?? undefined,
      treatmentGrams: treatment === 'sugar' ? 15 : undefined,
    });
    await scheduleHypoFollowUp(Date.now());
    Alert.alert('Salvo', 'Lembrete em 15 minutos pra remedir (regra dos 15).');
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: '#fff5f5' }]}>
      <Text style={styles.title}>Episódio de hipo</Text>
      <BigNumber value={parseInt(value, 10) || '–'} color={theme.colors.danger} />
      <View style={{ height: theme.spacing.md }} />
      <Keypad value={value} onChange={setValue} onConfirm={() => {}} />

      <Text style={styles.section}>Sintomas</Text>
      <View style={styles.grid}>
        {SYMPTOMS.map((s) => (
          <Pressable key={s.key} onPress={() => toggle(s.key)}
            style={[styles.chip, symptoms.includes(s.key) && styles.chipSel]}>
            <Text style={[styles.chipTxt, symptoms.includes(s.key) && styles.chipTxtSel]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Tratamento</Text>
      <View style={styles.grid}>
        {TREATMENTS.map((t) => (
          <Pressable key={t.key} onPress={() => setTreatment(t.key)}
            style={[styles.chip, treatment === t.key && styles.chipSel]}>
            <Text style={[styles.chipTxt, treatment === t.key && styles.chipTxtSel]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar e definir lembrete 15min" variant="danger" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  title: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.danger, textAlign: 'center' },
  section: { marginTop: theme.spacing.lg, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#fff',
  },
  chipSel: { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger },
  chipTxt: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  chipTxtSel: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/hypo.tsx
git commit -m "feat(hypo): logging flow with sympt + treatment + auto follow-up"
```

---

## Task 26: Insulin log screen

**Files:**
- Create: `app/insulin.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/insulin.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { insulinRepo } from '@/domain/insulin';
import { measurementRepo } from '@/domain/measurement';
import { getDbSync } from '@/db/client';
import { validateInsulinUnits } from '@/domain/validators';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import type { InsulinType } from '@/domain/types';

export default function InsulinScreen() {
  const [units, setUnits] = useState(2);
  const [insulinType, setInsulinType] = useState<InsulinType>('bolus');
  const [brand, setBrand] = useState('');
  const [linkLatest, setLinkLatest] = useState(true);

  const submit = () => {
    const v = validateInsulinUnits(units);
    if (!v.ok) { Alert.alert('Unidades inválidas', v.reason); return; }
    const repo = insulinRepo(getDbSync());
    const lastM = linkLatest ? measurementRepo(getDbSync()).latest() : null;
    repo.insert({
      units,
      insulinType,
      insulinBrand: brand || null,
      takenAt: Date.now(),
      measurementId: lastM?.id ?? null,
    });
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Insulina aplicada</Text>

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.row}>
        {(['basal','bolus'] as const).map((t) => (
          <Pressable key={t} onPress={() => setInsulinType(t)}
            style={[styles.tab, insulinType === t && styles.tabSel]}>
            <Text style={[styles.tabTxt, insulinType === t && styles.tabTxtSel]}>
              {t === 'basal' ? 'Basal' : 'Bolus'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Unidades</Text>
      <View style={styles.stepperRow}>
        <Pressable onPress={() => setUnits((u) => Math.max(0, u - 0.5))} style={styles.stepBtn}><Text style={styles.stepTxt}>−</Text></Pressable>
        <Text style={styles.units}>{units.toFixed(1)}</Text>
        <Pressable onPress={() => setUnits((u) => Math.min(100, u + 0.5))} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></Pressable>
      </View>

      <Text style={styles.label}>Marca (opcional)</Text>
      <TextInput value={brand} onChangeText={setBrand} placeholder="ex.: Lantus, Tresiba, NovoRapid"
        style={styles.input} placeholderTextColor={theme.colors.textMuted} />

      <Pressable onPress={() => setLinkLatest(!linkLatest)} style={styles.toggleRow}>
        <View style={[styles.checkbox, linkLatest && styles.checkboxOn]} />
        <Text style={styles.toggleTxt}>Vincular à última medição</Text>
      </Pressable>

      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar dose" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  title: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  label: { marginTop: theme.spacing.md, fontSize: theme.fontSizes.sm, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  tab: { flex: 1, paddingVertical: theme.spacing.md, borderRadius: theme.radii.md, backgroundColor: theme.colors.cardBg, alignItems: 'center' },
  tabSel: { backgroundColor: theme.colors.accent },
  tabTxt: { color: theme.colors.text, fontWeight: '600' },
  tabTxtSel: { color: '#fff' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.cardBg, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: theme.fontSizes.xl, color: theme.colors.text, fontWeight: '700' },
  units: { fontSize: theme.fontSizes.hero, fontWeight: '300', color: theme.colors.text, minWidth: 100, textAlign: 'center' },
  input: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: theme.colors.accent },
  checkboxOn: { backgroundColor: theme.colors.accent },
  toggleTxt: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/insulin.tsx
git commit -m "feat(insulin): basal/bolus log with stepper + optional measurement link"
```

---

## Task 27: Trend screen

**Files:**
- Create: `app/trend.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/trend.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSettings } from '@/ui/hooks/useSettings';
import { useMeasurementsInRange } from '@/ui/hooks/useMeasurements';
import { useStats } from '@/ui/hooks/useStats';
import { bucketByTimeOfDay } from '@/domain/stats';
import { TrendChart } from '@/ui/components/TrendChart';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import { generateAndShareReport } from '@/pdf/report';

const RANGES = [
  { key: '7', label: '7 dias', days: 7 },
  { key: '30', label: '30 dias', days: 30 },
  { key: '90', label: '90 dias', days: 90 },
] as const;

export default function TrendScreen() {
  const { data: settings } = useSettings();
  const [rangeKey, setRangeKey] = useState<'7'|'30'|'90'>('30');
  const days = RANGES.find((r) => r.key === rangeKey)!.days;
  const to = Date.now();
  const from = to - days * 24 * 3600_000;
  const { data } = useMeasurementsInRange(from, to);
  const stats = useStats(data, settings?.targetLow ?? 70, settings?.targetHigh ?? 180);
  const buckets = bucketByTimeOfDay(data);

  if (!settings) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.tabs}>
        {RANGES.map((r) => (
          <Pressable key={r.key} onPress={() => setRangeKey(r.key)}
            style={[styles.tab, rangeKey === r.key && styles.tabSel]}>
            <Text style={[styles.tabTxt, rangeKey === r.key && styles.tabTxtSel]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <TrendChart data={data} targetLow={settings.targetLow} targetHigh={settings.targetHigh} />

      <View style={styles.statRow}>
        <Stat label="TIR" value={`${stats.tirPct}%`} />
        <Stat label="Média" value={String(stats.meanMgdl)} />
        <Stat label="Hipos" value={String(stats.hypoCount)} />
      </View>

      <Text style={styles.section}>Por janela do dia</Text>
      <Row label="Manhã (06–12)" value={buckets.morning.mean} count={buckets.morning.count} />
      <Row label="Tarde (12–18)" value={buckets.afternoon.mean} count={buckets.afternoon.count} />
      <Row label="Noite (18–24)" value={buckets.evening.mean} count={buckets.evening.count} />
      <Row label="Madrugada (00–06)" value={buckets.night.mean} count={buckets.night.count} />

      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Exportar PDF" onPress={() => generateAndShareReport(data, settings, days)} />
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value, count }: { label: string; value: number; count: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{count === 0 ? '—' : `${value} mg/dL`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  tabs: { flexDirection: 'row', gap: theme.spacing.sm },
  tab: { flex: 1, paddingVertical: theme.spacing.sm, borderRadius: theme.radii.md, backgroundColor: theme.colors.cardBg, alignItems: 'center' },
  tabSel: { backgroundColor: theme.colors.accent },
  tabTxt: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  tabTxtSel: { color: '#fff', fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  stat: { flex: 1, padding: theme.spacing.md, backgroundColor: theme.colors.cardBg, borderRadius: theme.radii.md, alignItems: 'center' },
  statValue: { fontSize: theme.fontSizes.xl, fontWeight: '700', color: theme.colors.text },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginTop: theme.spacing.md, fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderColor: theme.colors.border },
  rowLabel: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  rowValue: { color: theme.colors.accent, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/trend.tsx
git commit -m "feat(trend): chart + stats + by-time-of-day + PDF export trigger"
```

---

## Task 28: PDF report builder

**Files:**
- Create: `src/pdf/report.ts`

- [ ] **Step 1: Implement**

```ts
// src/pdf/report.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { computeStats } from '@/domain/stats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Measurement, Settings } from '@/domain/types';

function buildHtml(data: Measurement[], settings: Settings, days: number): string {
  const stats = computeStats(data, { targetLow: settings.targetLow, targetHigh: settings.targetHigh });
  const rows = data
    .slice()
    .sort((a, b) => b.measuredAt - a.measuredAt)
    .map((m) => `
      <tr>
        <td>${format(new Date(m.measuredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
        <td>${m.valueMgdl}</td>
        <td>${m.context}</td>
      </tr>
    `).join('');
  const name = settings.displayName ?? '—';
  return `
    <html>
      <head><meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, sans-serif; padding: 24px; color: #2d3a2d; }
          h1 { color: #5a7a5a; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 6px 8px; border-bottom: 1px solid #d8d4c8; text-align: left; font-size: 12px; }
          .stats { display: flex; gap: 16px; margin-top: 12px; }
          .stat { flex: 1; padding: 12px; background: #e8e4d8; border-radius: 8px; }
          .stat strong { font-size: 18px; }
        </style>
      </head>
      <body>
        <h1>Glico — Relatório de glicemia</h1>
        <p>Paciente: <strong>${name}</strong> · Período: últimos ${days} dias · Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        <p>Faixa alvo: ${settings.targetLow}–${settings.targetHigh} mg/dL · Hipo: &lt;${settings.hypoThreshold} · Hiper: &gt;${settings.hyperThreshold}</p>
        <div class="stats">
          <div class="stat"><strong>${stats.tirPct}%</strong><br>Tempo no alvo</div>
          <div class="stat"><strong>${stats.meanMgdl}</strong><br>Média</div>
          <div class="stat"><strong>${stats.stdDev}</strong><br>Desvio padrão</div>
          <div class="stat"><strong>${stats.hypoCount}</strong><br>Hipos</div>
          <div class="stat"><strong>${stats.count}</strong><br>Medições</div>
        </div>
        <h2>Tabela de medições</h2>
        <table>
          <thead><tr><th>Data/Hora</th><th>mg/dL</th><th>Contexto</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px; color:#888; font-size:11px">Compartilhe apenas com seu médico.</p>
      </body>
    </html>
  `;
}

export async function generateAndShareReport(
  data: Measurement[],
  settings: Settings,
  days: number,
): Promise<void> {
  const html = buildHtml(data, settings, days);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Relatório Glico' });
  }
}
```

- [ ] **Step 2: Install expo-sharing**

```bash
npx expo install expo-sharing
```

- [ ] **Step 3: Commit**

```bash
git add src/pdf/report.ts package.json
git commit -m "feat(pdf): report builder + share dialog"
```

---

## Task 29: Profile screens

**Files:**
- Create: `app/profile/index.tsx`
- Create: `app/profile/targets.tsx`
- Create: `app/profile/reminders.tsx`
- Create: `app/profile/about.tsx`

- [ ] **Step 1: Profile home**

```tsx
// app/profile/index.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useSettings } from '@/ui/hooks/useSettings';
import { theme } from '@/ui/theme';
import { ActionButton } from '@/ui/components/ActionButton';

export default function ProfileScreen() {
  const { data: s } = useSettings();
  if (!s) return null;
  const initial = (s.displayName ?? '?').slice(0, 1).toUpperCase();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        {s.avatarUri ? <Image source={{ uri: s.avatarUri }} style={{ width: 64, height: 64, borderRadius: 32 }} /> :
          <Text style={styles.avatarTxt}>{initial}</Text>}
      </View>
      <Text style={styles.name}>{s.displayName ?? 'Sem nome'}</Text>
      <Text style={styles.subtle}>T1{s.diagnosisYear ? ` desde ${s.diagnosisYear}` : ''} · {s.insulinMethod === 'pen' ? 'caneta MDI' : 'bomba'}</Text>

      <Text style={styles.section}>Alvos</Text>
      <Row label="Faixa alvo" value={`${s.targetLow}–${s.targetHigh} mg/dL`} onPress={() => router.push('/profile/targets')} />
      <Row label="Hipoglicemia" value={`< ${s.hypoThreshold}`} />
      <Row label="Hiperglicemia" value={`> ${s.hyperThreshold}`} />

      <Text style={styles.section}>Lembretes</Text>
      <Row label="Configurar lembretes" value="›" onPress={() => router.push('/profile/reminders')} />

      <Text style={styles.section}>Dados</Text>
      <Row label="Sobre & privacidade" value="›" onPress={() => router.push('/profile/about')} />
    </ScrollView>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.cardBg, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: theme.fontSizes.xl, color: theme.colors.accent, fontWeight: '700' },
  name: { textAlign: 'center', fontWeight: '600', color: theme.colors.text, marginTop: theme.spacing.sm },
  subtle: { textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSizes.xs },
  section: { marginTop: theme.spacing.lg, fontSize: theme.fontSizes.xs, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderColor: theme.colors.border },
  rowLabel: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  rowValue: { color: theme.colors.accent, fontWeight: '600' },
});
```

- [ ] **Step 2: Targets editor**

```tsx
// app/profile/targets.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { settingsRepo } from '@/domain/settings';
import { getDbSync } from '@/db/client';
import { useSettings } from '@/ui/hooks/useSettings';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';

export default function TargetsScreen() {
  const { data: s, reload } = useSettings();
  const [low, setLow] = useState(String(s?.targetLow ?? 70));
  const [high, setHigh] = useState(String(s?.targetHigh ?? 180));
  const [hypo, setHypo] = useState(String(s?.hypoThreshold ?? 70));
  const [hyper, setHyper] = useState(String(s?.hyperThreshold ?? 250));

  const save = () => {
    const lo = parseInt(low,10), hi = parseInt(high,10), hy = parseInt(hypo,10), hr = parseInt(hyper,10);
    if (!(lo > 0 && hi > lo && hy > 0 && hr > hi)) {
      Alert.alert('Valores inválidos', 'Verifique a ordem: hipo < alvo low < alvo high < hiper.');
      return;
    }
    settingsRepo(getDbSync()).update({ targetLow: lo, targetHigh: hi, hypoThreshold: hy, hyperThreshold: hr });
    reload();
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Field label="Alvo low (mg/dL)" value={low} onChangeText={setLow} />
      <Field label="Alvo high (mg/dL)" value={high} onChangeText={setHigh} />
      <Field label="Hipoglicemia (<)" value={hypo} onChangeText={setHypo} />
      <Field label="Hiperglicemia (>)" value={hyper} onChangeText={setHyper} />
      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar" onPress={save} />
    </ScrollView>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (s: string) => void }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput keyboardType="number-pad" value={value} onChangeText={onChangeText} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  label: { fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: theme.spacing.md },
  input: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
});
```

- [ ] **Step 3: Reminders CRUD**

```tsx
// app/profile/reminders.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from 'react-native';
import { reminderRepo } from '@/domain/reminder';
import { getDbSync } from '@/db/client';
import { useEffect, useState, useCallback } from 'react';
import type { Reminder } from '@/domain/types';
import { syncReminders } from '@/notifications/scheduler';
import { theme } from '@/ui/theme';

export default function RemindersScreen() {
  const [items, setItems] = useState<Reminder[]>([]);
  const reload = useCallback(() => {
    setItems(reminderRepo(getDbSync()).listAll());
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const toggle = async (r: Reminder, enabled: boolean) => {
    reminderRepo(getDbSync()).setEnabled(r.id, enabled);
    reload();
    const updated = reminderRepo(getDbSync()).listEnabled();
    await syncReminders(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.help}>Toque para alternar. Lembrete silencia automaticamente se você já mediu na janela ±tolerância.</Text>
      {items.map((r) => (
        <View key={r.id} style={styles.row}>
          <View>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.subtle}>{r.timeOfDay} · ±{r.toleranceMinutes}min</Text>
          </View>
          <Switch value={r.enabled} onValueChange={(v) => toggle(r, v)}
            thumbColor={r.enabled ? theme.colors.accent : '#ccc'} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  help: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderColor: theme.colors.border },
  label: { color: theme.colors.text, fontSize: theme.fontSizes.md, fontWeight: '600' },
  subtle: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs },
});
```

- [ ] **Step 4: About**

```tsx
// app/profile/about.tsx
import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { theme } from '@/ui/theme';

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Glico</Text>
      <Text style={styles.version}>Versão 0.1.0</Text>
      <Text style={styles.body}>
        Seus dados nunca saem do seu celular. Só você tem acesso. Backup é seu, exportação é sua.
      </Text>
      <Text style={styles.body}>
        Este app não substitui orientação médica. Em caso de hipoglicemia grave ou cetoacidose, procure atendimento de emergência.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.md },
  title: { fontSize: theme.fontSizes.xl, fontWeight: '700', color: theme.colors.text },
  version: { color: theme.colors.textMuted, fontSize: theme.fontSizes.sm },
  body: { color: theme.colors.text, fontSize: theme.fontSizes.sm, lineHeight: 20 },
});
```

- [ ] **Step 5: Commit**

```bash
git add app/profile/
git commit -m "feat(profile): home + targets editor + reminders CRUD + about"
```

---

## Task 30: Onboarding flow

**Files:**
- Create: `app/onboarding/_layout.tsx`
- Create: `app/onboarding/welcome.tsx`
- Create: `app/onboarding/name.tsx`
- Create: `app/onboarding/targets.tsx`
- Create: `app/onboarding/reminders.tsx`

- [ ] **Step 1: Layout**

```tsx
// app/onboarding/_layout.tsx
import { Stack } from 'expo-router';
import { theme } from '@/ui/theme';
export default function OnboardingLayout() {
  return <Stack screenOptions={{
    headerShown: false,
    contentStyle: { backgroundColor: theme.colors.bg },
  }} />;
}
```

- [ ] **Step 2: Welcome**

```tsx
// app/onboarding/welcome.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vinda ao Glico</Text>
      <Text style={styles.body}>Registro rápido de glicemia com lembretes que respeitam seu ritmo. Tudo fica no seu celular.</Text>
      <ActionButton label="Começar" onPress={() => router.push('/onboarding/name')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.lg },
  title: { fontSize: theme.fontSizes.xl, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  body: { fontSize: theme.fontSizes.md, color: theme.colors.text, textAlign: 'center', lineHeight: 22 },
});
```

- [ ] **Step 3: Name**

```tsx
// app/onboarding/name.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { settingsRepo } from '@/domain/settings';
import { getDbSync } from '@/db/client';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';

export default function Name() {
  const [name, setName] = useState('');
  const next = () => {
    if (!name.trim()) { Alert.alert('Nome obrigatório'); return; }
    settingsRepo(getDbSync()).update({ displayName: name.trim() });
    router.push('/onboarding/targets');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Como você se chama?</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Nome"
        style={styles.input} placeholderTextColor={theme.colors.textMuted} />
      <ActionButton label="Continuar" onPress={next} disabled={!name} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.md },
  title: { fontSize: theme.fontSizes.lg, color: theme.colors.text },
  input: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
});
```

- [ ] **Step 4: Targets default review**

```tsx
// app/onboarding/targets.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';

export default function TargetsOnboarding() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seus alvos</Text>
      <Text style={styles.body}>
        Adotamos a faixa padrão recomendada: 70 a 180 mg/dL no alvo, hipoglicemia abaixo de 70.
        Você pode ajustar tudo no perfil quando quiser.
      </Text>
      <ActionButton label="Próximo" onPress={() => router.push('/onboarding/reminders')} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.md },
  title: { fontSize: theme.fontSizes.lg, color: theme.colors.text, fontWeight: '700' },
  body: { fontSize: theme.fontSizes.md, color: theme.colors.text, lineHeight: 22 },
});
```

- [ ] **Step 5: Reminders permission + sync**

```tsx
// app/onboarding/reminders.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import { ensurePermissions, syncReminders } from '@/notifications/scheduler';
import { reminderRepo } from '@/domain/reminder';
import { getDbSync } from '@/db/client';

export default function RemindersOnboarding() {
  const finish = async () => {
    await ensurePermissions();
    await syncReminders(reminderRepo(getDbSync()).listEnabled());
    router.replace('/');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lembretes</Text>
      <Text style={styles.body}>
        Criamos 6 lembretes default ao longo do dia. Eles silenciam automaticamente se você já mediu
        na janela próxima. Você pode editar tudo em Perfil &gt; Lembretes.
      </Text>
      <ActionButton label="Permitir lembretes e começar" onPress={finish} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.md },
  title: { fontSize: theme.fontSizes.lg, color: theme.colors.text, fontWeight: '700' },
  body: { fontSize: theme.fontSizes.md, color: theme.colors.text, lineHeight: 22 },
});
```

- [ ] **Step 6: Onboarding gate in root layout**

Update `app/_layout.tsx`: after `openDb`, check `settingsRepo(getDbSync()).get().displayName`. If null, redirect to `/onboarding/welcome`.

```tsx
// patch in app/_layout.tsx after setReady(true) — replace whole component:
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { openDb, getDbSync } from '@/db/client';
import { settingsRepo } from '@/domain/settings';
import { theme } from '@/ui/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  useEffect(() => {
    (async () => {
      await openDb();
      const s = settingsRepo(getDbSync()).get();
      setReady(true);
      if (!s.displayName) router.replace('/onboarding/welcome');
    })();
  }, [router]);
  if (!ready) {
    return <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: theme.colors.bg }}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>;
  }
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: theme.colors.bg },
      headerTitleStyle: { color: theme.colors.text },
      contentStyle: { backgroundColor: theme.colors.bg },
    }} />
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add app/onboarding/ app/_layout.tsx
git commit -m "feat(onboarding): 4-step flow with permissions + reminder sync"
```

---

## Task 31: Notification deep-link handling

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add notification response handler**

Append after `useEffect` in `app/_layout.tsx`:

```tsx
import * as Notifications from 'expo-notifications';

// inside RootLayout component, additional useEffect:
useEffect(() => {
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const link = resp.notification.request.content.data?.deepLink as string | undefined;
    if (link && link.startsWith('glico://')) {
      const path = link.replace('glico://', '/');
      router.push(path as never);
    }
  });
  return () => sub.remove();
}, [router]);
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(deep-link): route notification taps to log screen with context"
```

---

## Task 32: E2E flows (Maestro)

**Files:**
- Create: `tests/e2e/onboarding.yaml`
- Create: `tests/e2e/log-from-notification.yaml`
- Create: `tests/e2e/hypo-flow.yaml`
- Create: `tests/e2e/export-pdf.yaml`

- [ ] **Step 1: Onboarding flow**

```yaml
# tests/e2e/onboarding.yaml
appId: com.luizhcrs.glico
---
- launchApp:
    clearState: true
- assertVisible: "Bem-vinda ao Glico"
- tapOn: "Começar"
- inputText: "Maria"
- tapOn: "Continuar"
- assertVisible: "Seus alvos"
- tapOn: "Próximo"
- tapOn: "Permitir lembretes e começar"
- assertVisible: "Olá, Maria"
```

- [ ] **Step 2: Hypo flow**

```yaml
# tests/e2e/hypo-flow.yaml
appId: com.luizhcrs.glico
---
- launchApp
- tapOn: "Hipo"
- assertVisible: "Episódio de hipo"
- tapOn: "5"
- tapOn: "8"
- tapOn: "Tremor"
- tapOn: "Suor"
- tapOn: "Açúcar 15g"
- tapOn: "Salvar e definir lembrete 15min"
- assertVisible: "Lembrete em 15 minutos"
- tapOn: "OK"
- assertVisible: "Olá"
```

- [ ] **Step 3: PDF export**

```yaml
# tests/e2e/export-pdf.yaml
appId: com.luizhcrs.glico
---
- launchApp
- tapOn:
    text: "Tendência"
    optional: true
- tapOn: "Exportar PDF"
- assertVisible:
    text: "Compartilhar"
    optional: true
```

- [ ] **Step 4: Log from notification (manual instructions in YAML)**

```yaml
# tests/e2e/log-from-notification.yaml
# This flow requires a triggered local push. Maestro Cloud or manual trigger:
# 1. Run this device with Glico open.
# 2. Wait for next reminder OR call:
#    npx maestro test --include-tags=manual-push
# 3. Tap notification body (not the bell).
# 4. Assert log screen opens with pre-filled context.
appId: com.luizhcrs.glico
tags: [manual-push]
---
- launchApp
- assertVisible: "Olá"
# Manual: tap notification on system tray.
- assertVisible:
    text: "Nova medição"
    timeout: 60000
```

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/
git commit -m "test(e2e): Maestro flows for onboarding, hypo, PDF, deep-link"
```

---

## Task 33: App-lock toggle in profile (PIN-only, biometric is fase 2)

**Files:**
- Create: `app/profile/lock.tsx`
- Modify: `app/profile/index.tsx` (add row linking to lock)
- Modify: `app/_layout.tsx` (gate when app-lock enabled)

- [ ] **Step 1: Create PIN setup/verify screen**

```tsx
// app/profile/lock.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { setAppPin, clearAppPin, hasAppPin } from '@/crypto/keychain';
import { settingsRepo } from '@/domain/settings';
import { getDbSync } from '@/db/client';
import { useSettings } from '@/ui/hooks/useSettings';
import { ActionButton } from '@/ui/components/ActionButton';
import { theme } from '@/ui/theme';
import { useEffect } from 'react';

export default function LockScreen() {
  const { data: s, reload } = useSettings();
  const [enabled, setEnabled] = useState(s?.appLockEnabled ?? false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  useEffect(() => { setEnabled(s?.appLockEnabled ?? false); }, [s?.appLockEnabled]);

  const save = async () => {
    if (enabled) {
      if (pin.length < 4 || pin.length > 8) { Alert.alert('PIN', 'Use 4 a 8 dígitos.'); return; }
      if (pin !== pinConfirm) { Alert.alert('PIN', 'Confirmação não bate.'); return; }
      await setAppPin(pin);
      settingsRepo(getDbSync()).update({ appLockEnabled: true });
    } else {
      await clearAppPin();
      settingsRepo(getDbSync()).update({ appLockEnabled: false });
    }
    reload();
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Ativar bloqueio com PIN</Text>
        <Switch value={enabled} onValueChange={setEnabled}
          thumbColor={enabled ? theme.colors.accent : '#ccc'} />
      </View>
      {enabled && (
        <>
          <Text style={styles.help}>4 a 8 dígitos. Esqueceu o PIN? Você precisará reinstalar o app — todos os dados locais serão perdidos.</Text>
          <TextInput value={pin} onChangeText={setPin} placeholder="PIN" keyboardType="number-pad" secureTextEntry maxLength={8} style={styles.input} />
          <TextInput value={pinConfirm} onChangeText={setPinConfirm} placeholder="Confirme o PIN" keyboardType="number-pad" secureTextEntry maxLength={8} style={styles.input} />
        </>
      )}
      <View style={{ height: theme.spacing.lg }} />
      <ActionButton label="Salvar" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md },
  label: { color: theme.colors.text, fontSize: theme.fontSizes.md },
  help: { color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, marginVertical: theme.spacing.sm },
  input: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, marginTop: theme.spacing.sm },
});
```

- [ ] **Step 2: Add row in profile/index.tsx**

In `app/profile/index.tsx`, inside the "Dados" section right above the "Sobre & privacidade" row, add:

```tsx
<Row label={s.appLockEnabled ? 'Bloqueio: ativo' : 'Bloqueio do app'} value="›" onPress={() => router.push('/profile/lock')} />
```

- [ ] **Step 3: Gate root layout**

In `app/_layout.tsx`, add a lock state. After db/settings load, if `settings.appLockEnabled` is true, show a PIN entry overlay before rendering the Stack.

```tsx
// add inside RootLayout, after openDb + settings fetch:
const [unlocked, setUnlocked] = useState(false);
const [needLock, setNeedLock] = useState(false);
const [pinTry, setPinTry] = useState('');

useEffect(() => {
  (async () => {
    await openDb();
    const s = settingsRepo(getDbSync()).get();
    if (s.appLockEnabled && await hasAppPin()) setNeedLock(true);
    else setUnlocked(true);
    setReady(true);
    if (!s.displayName) router.replace('/onboarding/welcome');
  })();
}, [router]);

// before Stack render:
if (needLock && !unlocked) {
  return (
    <View style={{ flex:1, justifyContent:'center', padding: theme.spacing.xl, backgroundColor: theme.colors.bg }}>
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSizes.lg, marginBottom: theme.spacing.md }}>Digite seu PIN</Text>
      <TextInput value={pinTry} onChangeText={setPinTry} secureTextEntry keyboardType="number-pad" maxLength={8}
        style={{ backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text }} />
      <View style={{ height: theme.spacing.md }} />
      <ActionButton label="Desbloquear" onPress={async () => {
        if (await verifyAppPin(pinTry)) setUnlocked(true);
        else { Alert.alert('PIN incorreto'); setPinTry(''); }
      }} />
    </View>
  );
}
```

Add corresponding imports at top of file: `import { TextInput, Alert } from 'react-native';`, `import { hasAppPin, verifyAppPin } from '@/crypto/keychain';`, `import { ActionButton } from '@/ui/components/ActionButton';`, `import { Text } from 'react-native';`.

- [ ] **Step 4: Commit**

```bash
git add app/profile/lock.tsx app/profile/index.tsx app/_layout.tsx
git commit -m "feat(lock): optional PIN gate with profile toggle"
```

---

## Task 34: Final smoke + tag v0.1.0

- [ ] **Step 1: Full type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Full test suite**

```bash
npx jest
```

Expected: all unit + integration green.

- [ ] **Step 3: Build prod bundle (validation only)**

```bash
npx expo prebuild --clean
```

Expected: native projects generated without errors.

- [ ] **Step 4: Tag**

```bash
git tag v0.1.0
git log --oneline -1
```

- [ ] **Step 5: Done**

MVP scope complete. Surfaces left untested live: device-side push triggering, real SQLite encryption layer (depends on whether op-sqlite is added in fase 2), Apple Health/Google Fit (out of scope).
