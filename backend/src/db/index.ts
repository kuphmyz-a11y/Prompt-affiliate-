import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../../db/app.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

interface QueryParams {
  [key: string]: any;
}

export function query(sql: string, params: QueryParams = {}): any[] {
  const stmt = db.prepare(sql);
  return stmt.all(params);
}

export function run(sql: string, params: QueryParams = {}): any {
  const stmt = db.prepare(sql);
  return stmt.run(params);
}

export function get(sql: string, params: QueryParams = {}): any {
  const stmt = db.prepare(sql);
  return stmt.get(params);
}

export function exec(sql: string): void {
  db.exec(sql);
}

export default db;
