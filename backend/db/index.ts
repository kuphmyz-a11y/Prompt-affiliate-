import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'app.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function query(sql: string, params?: any[]): any[] {
  const stmt = db.prepare(sql);
  return stmt.all(params || []);
}

export function get(sql: string, params?: any[]): any {
  const stmt = db.prepare(sql);
  return stmt.get(params || []);
}

export function run(sql: string, params?: any[]): any {
  const stmt = db.prepare(sql);
  return stmt.run(params || []);
}

export default db;
