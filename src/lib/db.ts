import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { SQLInputValue } from 'node:sqlite';
import { Pool, types } from 'pg';

type Row = Record<string, any>;
type Result = { rows: Row[]; changes: number; lastInsertRowid?: number | bigint };
type Mode = 'rows' | 'run';
export interface DatabaseConnection {
  query(sql: string, params?: SQLInputValue[], mode?: Mode): Promise<Result>;
  exec(sql: string): Promise<void>;
  release(): void;
}
export interface DatabaseAdapter extends DatabaseConnection {
  kind: 'sqlite' | 'postgresql';
  connect(): Promise<DatabaseConnection>;
  close(): Promise<void>;
}
export class DatabaseConfigurationError extends Error {
  constructor() { super('Database ulanmagan. Vercel loyihasida DATABASE_URL ni sozlang va qayta deploy qiling.'); }
}
types.setTypeParser(20, value => {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error('Database integer is outside the safe numeric range.');
  return n;
});
const context = new AsyncLocalStorage<DatabaseConnection>();
let database: Promise<DatabaseAdapter> | undefined;
let injected: DatabaseAdapter | undefined;
export function databaseKind(): 'sqlite' | 'postgresql' {
  return injected?.kind ?? (process.env.DATABASE_URL ? 'postgresql' : 'sqlite');
}
export function postgresSql(sql: string): string {
  let result = '', quoted = '', index = 0;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (quoted) {
      result += ch;
      if (ch === quoted) {
        if (sql[i + 1] === quoted) result += sql[++i]; else quoted = '';
      }
    } else if (ch === "'" || ch === '"') { quoted = ch; result += ch; }
    else if (ch === '?') result += '$' + (++index);
    else result += ch;
  }
  if (/^\s*INSERT OR IGNORE\s/i.test(result)) result = result.replace(/INSERT OR IGNORE/i, 'INSERT').replace(/;\s*$/, '') + ' ON CONFLICT DO NOTHING';
  return result;
}
export function createPostgresConnection(client: Pick<Pool, 'query'>, release = () => {}): DatabaseConnection {
  return {
    async query(sql, params = [], mode = 'rows') {
      let query = postgresSql(sql);
      if (mode === 'run' && /^\s*INSERT INTO (users|courses|modules|lessons|assessments|questions|attempts|focus_sessions|labs|support)\s*\(/i.test(query) && !/\bRETURNING\b/i.test(query)) query = query.replace(/;\s*$/, '') + ' RETURNING id';
      const result = await client.query(query, params);
      return { rows: result.rows, changes: result.rowCount ?? 0, lastInsertRowid: result.rows[0]?.id };
    },
    async exec(sql) { await client.query(sql); }, release,
  };
}
async function createDatabase(): Promise<DatabaseAdapter> {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 });
    pool.on('error', () => console.error('Database pool connection error.'));
    return { ...createPostgresConnection(pool), kind: 'postgresql', async connect() {
      const client = await pool.connect();
      return createPostgresConnection(client as unknown as Pick<Pool, 'query'>, () => client.release());
    }, async close() { await pool.end(); } };
  }
  if (process.env.VERCEL) throw new DatabaseConfigurationError();
  const [{ DatabaseSync }, { mkdirSync }, { dirname }] = await Promise.all([import('node:sqlite'), import('node:fs'), import('node:path')]);
  const path = process.env.DATABASE_PATH || './data/ilmora.sqlite';
  if (path !== ':memory:') mkdirSync(dirname(resolve(/* turbopackIgnore: true */ path)), { recursive: true });
  const sqlite = new DatabaseSync(path);
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  sqlite.exec(await readFile(resolve('database/001_initial.sql'), 'utf8'));
  let queue = Promise.resolve();
  async function acquire() {
    const previous = queue;
    let release!: () => void;
    queue = new Promise<void>(done => { release = done; });
    await previous;
    return release;
  }
  const raw: DatabaseConnection = {
    async query(sql, params = [], mode = 'rows') {
      const statement = sqlite.prepare(sql);
      if (mode === 'run') {
        const r = statement.run(...params);
        return { rows: [], changes: Number(r.changes), lastInsertRowid: r.lastInsertRowid };
      }
      return { rows: statement.all(...params).map(row => ({ ...row })), changes: 0 };
    }, async exec(sql) { sqlite.exec(sql); }, release() {},
  };
  return { ...raw, kind: 'sqlite', async query(...args) {
    const release = await acquire(); try { return await raw.query(...args); } finally { release(); }
  }, async exec(sql) {
    const release = await acquire(); try { await raw.exec(sql); } finally { release(); }
  }, async connect() { return { ...raw, release: await acquire() }; }, async close() { sqlite.close(); } };
}
export function installTestDatabase(adapter: DatabaseAdapter) {
  if (process.env.NODE_ENV !== 'test' || database) throw new Error('Test adapter is only available before test database initialization.');
  injected = adapter;
}
async function getDatabase() { return injected ?? (database ??= createDatabase()); }
async function connection() { return context.getStore() ?? await getDatabase(); }
export async function all<T = Row>(sql: string, ...params: SQLInputValue[]): Promise<T[]> {
  return (await (await connection()).query(sql, params)).rows as T[];
}
export async function one<T = Row>(sql: string, ...params: SQLInputValue[]): Promise<T | undefined> { return (await all<T>(sql, ...params))[0]; }
export async function run(sql: string, ...params: SQLInputValue[]) { return (await connection()).query(sql, params, 'run'); }
export async function transaction<T>(fn: () => T | Promise<T>): Promise<T> {
  if (context.getStore()) return fn();
  const adapter = await getDatabase(), client = await adapter.connect();
  try {
    await client.exec(adapter.kind === 'sqlite' ? 'BEGIN IMMEDIATE' : 'BEGIN');
    const result = await context.run(client, fn);
    await client.exec('COMMIT');
    return result;
  } catch (error) {
    try { await client.exec('ROLLBACK'); } catch { /* Preserve the original failure. */ }
    throw error;
  } finally { client.release(); }
}
export async function lockUser(userId: number) {
  await one('SELECT id FROM users WHERE id=?' + (databaseKind() === 'postgresql' ? ' FOR UPDATE' : ''), userId);
}
export async function synchronizeIdentitySequences() {
  if (databaseKind() !== 'postgresql') return;
  for (const table of ['courses','modules','lessons','assessments']) {
    await (await connection()).query("SELECT setval(pg_get_serial_sequence('" + table + "','id'), COALESCE((SELECT MAX(id) FROM " + table + "),0)+1, false)");
  }
}
export async function migrateDatabase() {
  await getDatabase();
  if (databaseKind() === 'sqlite') return;
  const sql = await readFile(resolve('database/001_postgres.sql'), 'utf8');
  const checksum = createHash('sha256').update(sql).digest('hex');
  await transaction(async () => {
    await (await connection()).exec('SELECT pg_advisory_xact_lock(124223019); CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL);');
    const applied = await one<{ checksum: string }>('SELECT checksum FROM schema_migrations WHERE name=?', '001_postgres');
    if (applied) {
      if (applied.checksum !== checksum) throw new Error('Applied migration changed; create a new migration instead.');
      return;
    }
    await (await connection()).exec(sql);
    await run('INSERT INTO schema_migrations(name,checksum) VALUES(?,?)', '001_postgres', checksum);
  });
}
export async function closeDatabase() {
  const active = injected ?? (database ? await database.catch(() => undefined) : undefined);
  database = undefined; injected = undefined;
  await active?.close();
}
