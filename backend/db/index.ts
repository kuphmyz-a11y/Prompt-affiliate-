import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'app.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export function query<T = any>(sql: string, params?: any[]): T[] {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...(params || [])) as T[];
  } catch (err) {
    console.error('Query error:', sql, err);
    throw err;
  }
}

export function run(sql: string, params?: any[]): { changes: number; lastID: number } {
  try {
    const stmt = db.prepare(sql);
    const info = stmt.run(...(params || []));
    return { changes: info.changes, lastID: info.lastInsertRowid as number };
  } catch (err) {
    console.error('Run error:', sql, err);
    throw err;
  }
}

export function get<T = any>(sql: string, params?: any[]): T | undefined {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...(params || [])) as T | undefined;
  } catch (err) {
    console.error('Get error:', sql, err);
    throw err;
  }
}

export default db;