import { run, get } from '../src/db/index.js';
import logger from '../src/lib/logger.js';

export function seed() {
  try {
    // Insert demo scan session
    const sessionResult = run(
      `INSERT INTO scan_sessions (name, status, blocked_countries, preferred_tlds, markets_count, trends_count, domains_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Demo Scan PL', 'done', JSON.stringify(['DE', 'FR']), JSON.stringify(['.com', '.pl']), 5, 20, 10]
    );

    // Insert demo domains
    const domains = [
      { name: 'pozyczkipl', tld: '.com', market: 'PL', language: 'pl', segment: 'loans', keyword_local: 'pożyczki', price_usd: 8.99, cpc_usd: 2.5, epc_usd: 35, score: 82 },
      { name: 'segurosya', tld: '.com', market: 'ES', language: 'es', segment: 'insurance', keyword_local: 'seguros', price_usd: 9.99, cpc_usd: 3.2, epc_usd: 45, score: 88 },
      { name: 'viajespl', tld: '.pl', market: 'PL', language: 'pl', segment: 'travel', keyword_local: 'podróże', price_usd: 7.99, cpc_usd: 1.8, epc_usd: 28, score: 75 },
    ];

    for (const domain of domains) {
      run(
        `INSERT INTO domains (name, tld, market, language, segment, keyword_local, price_usd, cpc_usd, epc_usd, score, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [domain.name, domain.tld, domain.market, domain.language, domain.segment, domain.keyword_local, domain.price_usd, domain.cpc_usd, domain.epc_usd, domain.score, 'idea']
      );
    }

    // Insert demo pipeline runs
    run(
      `INSERT INTO pipeline_runs (step, market, status) VALUES (?, ?, ?)`,
      ['trend_radar', 'PL', 'done']
    );

    logger.info('Seed completed');
  } catch (err) {
    logger.error('Seed error', err);
  }
}

seed();