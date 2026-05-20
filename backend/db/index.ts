import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'app.sqlite');

let db: Database.Database | null = null;

export function initDB(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function getDB(): Database.Database {
  if (!db) {
    return initDB();
  }
  return db;
}

export function query<T>(sql: string, params?: any[]): T[] {
  const db = getDB();
  const stmt = db.prepare(sql);
  return (params ? stmt.all(...params) : stmt.all()) as T[];
}

export function run(sql: string, params?: any[]): Database.RunResult {
  const db = getDB();
  const stmt = db.prepare(sql);
  return params ? stmt.run(...params) : stmt.run();
}

export function get<T>(sql: string, params?: any[]): T | undefined {
  const db = getDB();
  const stmt = db.prepare(sql);
  return (params ? stmt.get(...params) : stmt.get()) as T | undefined;
}

export function close(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Auto-init on module load
initDB();