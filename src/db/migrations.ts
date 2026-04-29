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
