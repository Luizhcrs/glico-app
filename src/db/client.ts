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
