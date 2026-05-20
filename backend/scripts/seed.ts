import { run } from '../db/index.js';
import { migrate } from './migrate.js';

export function seed() {
  migrate();

  // Seed demo scan session
  try {
    run(
      'INSERT INTO scan_sessions (name, status, markets_count, trends_count, domains_count) VALUES (?, ?, ?, ?, ?)',
      {
        ':name': 'Demo Scan PL',
        ':status': 'done',
        ':markets_count': 5,
        ':trends_count': 25,
        ':domains_count': 15,
      }
    );
  } catch (err) {
    console.warn('Scan session already exists or error:', err);
  }

  // Seed demo domains
  const domains = [
    {
      name: 'pujckyonline',
      tld: '.cz',
      market: 'CZ',
      language: 'cs',
      segment: 'loans',
      keyword_local: 'půjčky online',
      score: 82,
      price_usd: 8.99,
      cpc_usd: 2.5,
      epc_usd: 35,
      status: 'idea',
    },
    {
      name: 'pojisteni-zivot',
      tld: '.cz',
      market: 'CZ',
      language: 'cs',
      segment: 'insurance',
      keyword_local: 'pojištění na život',
      score: 78,
      price_usd: 9.99,
      cpc_usd: 3.2,
      epc_usd: 45,
      status: 'idea',
    },
    {
      name: 'cestovani-zajezdy',
      tld: '.cz',
      market: 'CZ',
      language: 'cs',
      segment: 'travel',
      keyword_local: 'cestování zájezdy',
      score: 75,
      price_usd: 7.99,
      cpc_usd: 2.0,
      epc_usd: 40,
      status: 'idea',
    },
  ];

  domains.forEach((domain) => {
    try {
      run(
        'INSERT INTO domains (name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        {
          ':name': domain.name,
          ':tld': domain.tld,
          ':market': domain.market,
          ':language': domain.language,
          ':segment': domain.segment,
          ':keyword_local': domain.keyword_local,
          ':score': domain.score,
          ':price_usd': domain.price_usd,
          ':cpc_usd': domain.cpc_usd,
          ':epc_usd': domain.epc_usd,
          ':status': domain.status,
        }
      );
    } catch (err) {
      console.warn(`Domain ${domain.name} already exists or error:`, err);
    }
  });

  console.log('✓ Database seeded successfully');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
