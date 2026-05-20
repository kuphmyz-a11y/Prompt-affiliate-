import { run, get } from '../db/index.js';

export function seed(): void {
  // Check if already seeded
  const existingSession = get('SELECT id FROM scan_sessions LIMIT 1');
  if (existingSession) {
    console.log('[SEED] Database already seeded');
    return;
  }

  // Insert demo scan session
  run(
    `INSERT INTO scan_sessions (name, status, blocked_countries, preferred_tlds, max_price_usd)
     VALUES (?, ?, ?, ?, ?)`,
    ['Demo Scan PL', 'done', JSON.stringify(['DE', 'FR']), JSON.stringify(['.com', '.pl']), 10]
  );

  // Insert demo domains
  const domains = [
    {
      name: 'pozyczkipl',
      tld: '.com',
      market: 'PL',
      language: 'pl',
      segment: 'loans',
      keyword_local: 'pożyczki',
      score: 82,
      price_usd: 8.99,
      cpc_usd: 2.5,
      epc_usd: 35,
      status: 'idea',
    },
    {
      name: 'segurosya',
      tld: '.com',
      market: 'ES',
      language: 'es',
      segment: 'insurance',
      keyword_local: 'seguros',
      score: 88,
      price_usd: 9.99,
      cpc_usd: 3.2,
      epc_usd: 45,
      status: 'idea',
    },
    {
      name: 'creditosdemo',
      tld: '.com',
      market: 'PL',
      language: 'pl',
      segment: 'credit',
      keyword_local: 'kredyty',
      score: 76,
      price_usd: 7.99,
      cpc_usd: 2.2,
      epc_usd: 28,
      status: 'idea',
    },
  ];

  for (const domain of domains) {
    run(
      `INSERT INTO domains (name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        domain.name,
        domain.tld,
        domain.market,
        domain.language,
        domain.segment,
        domain.keyword_local,
        domain.score,
        domain.price_usd,
        domain.cpc_usd,
        domain.epc_usd,
        domain.status,
      ]
    );
  }

  // Insert default agent config
  const defaultConfig = {
    model: 'gpt-4o-mini',
    provider: 'openai',
    max_cost_usd_per_site: 10,
    max_domain_price_usd: 12,
    blocked_countries: ['DE', 'FR'],
    preferred_tlds: ['.com', '.pl', '.es', '.online'],
    target_segments: ['loans', 'insurance', 'dating'],
    epc_weight: 40,
    volume_weight: 30,
    competition_weight: 30,
  };

  run(
    `INSERT OR REPLACE INTO agent_config (id, data) VALUES (?, ?)`,
    ['singleton', JSON.stringify(defaultConfig)]
  );

  console.log('[SEED] Demo data inserted successfully');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
  process.exit(0);
}