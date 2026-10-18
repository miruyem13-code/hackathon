import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

let singleton: DatabaseSync | undefined;
export function db() {
  if (!singleton) {
    const path = process.env.DATABASE_PATH || './data/ilmora.sqlite';
    if (path !== ':memory:') mkdirSync(dirname(resolve(/* turbopackIgnore: true */ path)), { recursive: true });
    singleton = new DatabaseSync(path);
    singleton.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    singleton.exec(readFileSync(resolve('database/001_initial.sql'), 'utf8'));
  }
  return singleton;
}
// All values use prepared statements; identifiers are never taken from requests.
export function all<T = Record<string, any>>(sql: string, ...params: SQLInputValue[]): T[] {
  return db().prepare(sql).all(...params).map(row => ({ ...row })) as T[];
}
export function one<T = Record<string, any>>(sql: string, ...params: SQLInputValue[]): T | undefined {
  const row = db().prepare(sql).get(...params);
  return row ? { ...row } as T : undefined;
}
export function run(sql: string, ...params: SQLInputValue[]) { return db().prepare(sql).run(...params); }
export function transaction<T>(fn: () => T): T {
  db().exec('BEGIN IMMEDIATE');
  try { const result = fn(); db().exec('COMMIT'); return result; }
  catch (error) { db().exec('ROLLBACK'); throw error; }
}
