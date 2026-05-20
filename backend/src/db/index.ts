import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../db/app.sqlite');

let db: Database.Database | null = null;

export function getDB() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function query<T = unknown>(sql: string, params?: unknown[]): T[] {
  const stmt = getDB().prepare(sql);
  return stmt.all(...(params || [])) as T[];
}

export function run(sql: string, params?: unknown[]): Database.RunResult {
  const stmt = getDB().prepare(sql);
  return stmt.run(...(params || []));
}

export function get<T = unknown>(sql: string, params?: unknown[]): T | undefined {
  const stmt = getDB().prepare(sql);
  return stmt.get(...(params || [])) as T | undefined;
}

export function exec(sql: string) {
  return getDB().exec(sql);
}