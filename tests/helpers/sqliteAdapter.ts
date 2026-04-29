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
