import { exec } from '../db/index.js';

export function migrate() {
  const schema = `
    CREATE TABLE IF NOT EXISTS agent_config (
      id          TEXT PRIMARY KEY DEFAULT 'singleton',
      data        TEXT NOT NULL DEFAULT '{}',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role            TEXT NOT NULL,
      content         TEXT NOT NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS domains (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      name                TEXT NOT NULL,
      tld                 TEXT,
      market              TEXT,
      language            TEXT,
      segment             TEXT,
      keyword_local       TEXT,
      target_country      TEXT,
      score               INTEGER,
      price_usd           REAL,
      cpc_usd             REAL,
      epc_usd             REAL,
      buy_url             TEXT,
      cloudflare_url      TEXT,
      status              TEXT NOT NULL DEFAULT 'idea',
      affiliate_connected INTEGER NOT NULL DEFAULT 0,
      content_generated   INTEGER NOT NULL DEFAULT 0,
      notes               TEXT,
      seo_data            TEXT,
      legal_data          TEXT,
      affiliate_data      TEXT,
      content_data        TEXT,
      wp_published_url    TEXT,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      key         TEXT NOT NULL UNIQUE,
      label       TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT 'other',
      connected   INTEGER NOT NULL DEFAULT 0,
      config      TEXT DEFAULT '{}',
      meta        TEXT DEFAULT '{}',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scan_sessions (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      name                 TEXT NOT NULL,
      status               TEXT NOT NULL DEFAULT 'running',
      blocked_countries    TEXT DEFAULT '[]',
      preferred_tlds       TEXT DEFAULT '[]',
      max_price_usd        INTEGER DEFAULT 10,
      markets_data         TEXT,
      trends_data          TEXT,
      selected_trends_data TEXT,
      segments_data        TEXT,
      domains_data         TEXT,
      markets_count        INTEGER DEFAULT 0,
      trends_count         INTEGER DEFAULT 0,
      segments_count       INTEGER DEFAULT 0,
      domains_count        INTEGER DEFAULT 0,
      created_at           TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      step        TEXT NOT NULL,
      market      TEXT,
      topic       TEXT,
      input       TEXT,
      output      TEXT,
      status      TEXT NOT NULL DEFAULT 'pending',
      error       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `;

  try {
    exec(schema);
    console.log('✓ Database schema migrated successfully');
  } catch (err) {
    console.error('✗ Migration error:', err);
    throw err;
  }
}
