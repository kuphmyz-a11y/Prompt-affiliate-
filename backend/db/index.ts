import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'app.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export interface DBRow {
  [key: string]: unknown;
}

export function query(sql: string, params?: unknown[]): DBRow[] {
  const stmt = db.prepare(sql);
  return stmt.all(...(params || [])) as DBRow[];
}

export function run(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number } {
  const stmt = db.prepare(sql);
  const result = stmt.run(...(params || []));
  return { changes: result.changes, lastInsertRowid: result.lastInsertRowid as number };
}

export function get(sql: string, params?: unknown[]): DBRow | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...(params || [])) as DBRow | undefined;
}

export function transaction<T>(fn: () => T): T {
  const trans = db.transaction(fn);
  return trans();
}

export default db;
