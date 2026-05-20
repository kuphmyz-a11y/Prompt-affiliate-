import { query, run, get } from '../db/index.js';

function seed() {
  console.log('Seeding database...');
  
  try {
    // Check if already seeded
    const count = get<{ count: number }>('SELECT COUNT(*) as count FROM domains');
    if (count && count.count > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    // Insert agent config
    run(
      `INSERT OR IGNORE INTO agent_config (id, data) VALUES (?, ?)`,
      [
        'singleton',
        JSON.stringify({
          model: 'gpt-4o-mini',
          provider: 'openai',
          financial_limits: { max_cost_usd: 100, max_domain_price: 10 },
          geo_filters: { blocked_countries: ['DE', 'FR'], preferred_tlds: ['.com', '.pl', '.es', '.online'] },
          target_segments: ['loans', 'insurance', 'dating'],
          trend_weights: { epc_weight: 0.4, volume_weight: 0.3, competition_weight: 0.3 },
        }),
      ]
    );

    // Insert demo scan session
    const sessionResult = run(
      `INSERT INTO scan_sessions (name, status, blocked_countries, preferred_tlds, markets_data) VALUES (?, ?, ?, ?, ?)`,
      [
        'Demo Scan PL',
        'done',
        JSON.stringify(['DE', 'FR']),
        JSON.stringify(['.com', '.pl']),
        JSON.stringify({
          markets: [
            { iso: 'PL', name: 'Poland', language: 'pl', score: 82, recommended: true },
          ],
        }),
      ]
    );

    // Insert demo domains
    run(
      `INSERT INTO domains (name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['pozyczki', '.com', 'PL', 'pl', 'loans', 'pozyczki', 82, 8.99, 2.5, 35, 'idea']
    );

    run(
      `INSERT INTO domains (name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['ubezpieczenie', '.pl', 'PL', 'pl', 'insurance', 'ubezpieczenie', 78, 7.99, 3.0, 40, 'idea']
    );

    run(
      `INSERT INTO domains (name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['randki', '.pl', 'PL', 'pl', 'dating', 'randki', 75, 9.99, 2.0, 30, 'idea']
    );

    console.log('Seeding completed successfully');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}

export { seed };