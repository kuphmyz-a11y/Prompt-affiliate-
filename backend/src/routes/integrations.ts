import { Router } from 'express';
import logger from '../lib/logger.js';
import { query, run, get } from '../db/index.js';

const router = Router();

const integrationDefaults = [
  {
    key: 'wordpress',
    label: 'WordPress',
    category: 'publishing',
    description: 'Publish content to WordPress',
    website: 'https://wordpress.org',
    docs: 'https://developer.wordpress.org',
    fields: ['site_url', 'username', 'app_password'],
  },
  {
    key: 'namecheap',
    label: 'Namecheap',
    category: 'domains',
    description: 'Domain registration via Namecheap',
    website: 'https://namecheap.com',
    docs: 'https://www.namecheap.com/support/api',
    fields: ['api_key', 'username'],
  },
  {
    key: 'make',
    label: 'Make (Integromat)',
    category: 'automation',
    description: 'Automate workflows with Make',
    website: 'https://make.com',
    docs: 'https://www.make.com/docs',
    fields: ['webhook_url'],
  },
  {
    key: 'cloudflare',
    label: 'Cloudflare',
    category: 'hosting',
    description: 'DNS and CDN service',
    website: 'https://cloudflare.com',
    docs: 'https://developers.cloudflare.com',
    fields: ['api_token', 'account_id'],
  },
  {
    key: 'google_gsc',
    label: 'Google Search Console',
    category: 'seo',
    description: 'Monitor search performance',
    website: 'https://search.google.com/search-console',
    docs: 'https://developers.google.com/search/docs',
    fields: ['api_key', 'property_id'],
  },
  {
    key: 'google_ga4',
    label: 'Google Analytics 4',
    category: 'analytics',
    description: 'Track website analytics',
    website: 'https://analytics.google.com',
    docs: 'https://developers.google.com/analytics',
    fields: ['measurement_id', 'property_id'],
  },
  {
    key: 'awin',
    label: 'Awin',
    category: 'affiliate',
    description: 'Affiliate marketing network',
    website: 'https://awin.com',
    docs: 'https://wiki.awin.com',
    fields: ['account_id', 'api_key'],
  },
  {
    key: 'cj',
    label: 'Commission Junction',
    category: 'affiliate',
    description: 'Affiliate program network',
    website: 'https://cj.com',
    docs: 'https://developers.cj.com',
    fields: ['api_key', 'account_sid'],
  },
  {
    key: 'clickbank',
    label: 'ClickBank',
    category: 'affiliate',
    description: 'Digital product marketplace',
    website: 'https://clickbank.com',
    docs: 'https://clickbank.com/api',
    fields: ['api_key', 'account_id'],
  },
  {
    key: 'impact',
    label: 'Impact',
    category: 'affiliate',
    description: 'Partnership cloud platform',
    website: 'https://impact.com',
    docs: 'https://developer.impact.com',
    fields: ['api_key', 'account_sid'],
  },
  {
    key: 'dataforseo',
    label: 'DataForSEO',
    category: 'seo',
    description: 'SEO data and analysis',
    website: 'https://dataforseo.com',
    docs: 'https://docs.dataforseo.com',
    fields: ['login', 'password'],
  },
  {
    key: 'convertkit',
    label: 'ConvertKit',
    category: 'email',
    description: 'Email marketing platform',
    website: 'https://convertkit.com',
    docs: 'https://developers.convertkit.com',
    fields: ['api_key', 'api_secret'],
  },
  {
    key: 'uptime_robot',
    label: 'UptimeRobot',
    category: 'monitoring',
    description: 'Website monitoring service',
    website: 'https://uptimerobot.com',
    docs: 'https://uptimerobot.com/api',
    fields: ['api_key'],
  },
  {
    key: 'supabase',
    label: 'Supabase',
    category: 'database',
    description: 'Open-source Firebase alternative',
    website: 'https://supabase.com',
    docs: 'https://supabase.com/docs',
    fields: ['api_key', 'project_id'],
  },
  {
    key: 'amazon_assoc',
    label: 'Amazon Associates',
    category: 'affiliate',
    description: 'Amazon affiliate program',
    website: 'https://amazon.com',
    docs: 'https://affiliate-program.amazon.com',
    fields: ['api_key', 'account_id'],
  },
];

// GET /api/integrations
router.get('/', (req, res) => {
  try {
    const dbIntegrations = query('SELECT * FROM integrations');
    const dbMap = new Map(dbIntegrations.map((i: any) => [i.key, i]));

    const result = integrationDefaults.map((def) => {
      const dbItem = dbMap.get(def.key);
      return {
        ...def,
        connected: dbItem?.connected ? true : false,
        config_keys: def.fields,
        updated_at: dbItem?.updated_at || null,
        register_url: def.website,
      };
    });

    res.json(result);
  } catch (err) {
    logger.error('GET /integrations error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/integrations/:key/connect
router.post('/:key/connect', (req, res) => {
  try {
    const { key } = req.params;
    const config = req.body;

    const existing = get('SELECT id FROM integrations WHERE key = ?', { ':key': key });

    if (existing) {
      run(
        'UPDATE integrations SET config = ?, connected = 1, updated_at = datetime("now") WHERE key = ?',
        { ':config': JSON.stringify(config), ':key': key }
      );
    } else {
      run(
        'INSERT INTO integrations (key, label, category, config, connected) VALUES (?, ?, ?, ?, 1)',
        {
          ':key': key,
          ':label': key,
          ':category': 'other',
          ':config': JSON.stringify(config),
        }
      );
    }

    res.json({ key, connected: true, message: 'Connected successfully' });
  } catch (err) {
    logger.error('POST /integrations/:key/connect error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/integrations/:key
router.delete('/:key', (req, res) => {
  try {
    const { key } = req.params;

    run(
      'UPDATE integrations SET connected = 0, config = "{}", updated_at = datetime("now") WHERE key = ?',
      { ':key': key }
    );

    res.json({ key, connected: false });
  } catch (err) {
    logger.error('DELETE /integrations/:key error:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
