import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'app.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

interface QueryOptions {
  params?: unknown[];
  all?: boolean;
}

export function query<T = any>(sql: string, params?: unknown[]): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...(params || [])) as T[];
}

export function get<T = any>(sql: string, params?: unknown[]): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...(params || [])) as T | undefined;
}

export function run(sql: string, params?: unknown[]): { lastID?: number; changes: number } {
  const stmt = db.prepare(sql);
  const result = stmt.run(...(params || []));
  return { lastID: result.lastInsertRowid as number, changes: result.changes };
}

export function exec(sql: string): void {
  db.exec(sql);
}

export default db;
