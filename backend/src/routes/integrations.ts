import express, { Request, Response } from 'express';
import { query, get, run } from '../db/index.js';
import logger from '../lib/logger.js';

const router = express.Router();

// GET /api/integrations
router.get('/', (req: Request, res: Response) => {
  const defaults = [
    { key: 'dataforseo', label: 'DataForSEO', category: 'seo', description: 'SEO rank tracking', website: 'dataforseo.com', docs: 'docs.dataforseo.com', fields: ['login', 'password'], register_url: 'https://dataforseo.com' },
    { key: 'cloudflare', label: 'Cloudflare', category: 'hosting', description: 'DNS and CDN', website: 'cloudflare.com', docs: 'developers.cloudflare.com', fields: ['api_token'], register_url: 'https://cloudflare.com' },
    { key: 'google_gsc', label: 'Google Search Console', category: 'analytics', description: 'Search analytics', website: 'google.com/webmasters', docs: 'support.google.com/webmasters', fields: ['property_id'] },
    { key: 'google_ga4', label: 'Google Analytics 4', category: 'analytics', description: 'Web analytics', website: 'analytics.google.com', docs: 'support.google.com/analytics', fields: ['property_id'] },
    { key: 'namecheap', label: 'Namecheap', category: 'domains', description: 'Domain registrar', website: 'namecheap.com', docs: 'namecheap.com/support', fields: ['api_key', 'username'], register_url: 'https://namecheap.com' },
    { key: 'impact', label: 'Impact', category: 'affiliate', description: 'Affiliate network', website: 'impact.com', docs: 'impact.com/partner-api', fields: ['api_key'], register_url: 'https://impact.com' },
    { key: 'awin', label: 'Awin', category: 'affiliate', description: 'Affiliate network', website: 'awin.com', docs: 'awin.com/en/publishers/learn', fields: ['api_key'], register_url: 'https://awin.com' },
    { key: 'cj', label: 'CJ Affiliate', category: 'affiliate', description: 'Affiliate network', website: 'cj.com', docs: 'cj.com/en/learning', fields: ['api_key'], register_url: 'https://cj.com' },
    { key: 'clickbank', label: 'ClickBank', category: 'affiliate', description: 'Affiliate network', website: 'clickbank.com', docs: 'clickbank.com/help', fields: ['api_key'], register_url: 'https://clickbank.com' },
    { key: 'amazon_assoc', label: 'Amazon Associates', category: 'affiliate', description: 'Amazon affiliate', website: 'amazon.com', docs: 'associates.amazon.com', fields: ['tracking_id'] },
    { key: 'convertkit', label: 'ConvertKit', category: 'email', description: 'Email marketing', website: 'convertkit.com', docs: 'developers.convertkit.com', fields: ['api_key'], register_url: 'https://convertkit.com' },
    { key: 'uptime_robot', label: 'Uptime Robot', category: 'monitoring', description: 'Uptime monitoring', website: 'uptimerobot.com', docs: 'uptimerobot.com/api', fields: ['api_key'], register_url: 'https://uptimerobot.com' },
    { key: 'wordpress', label: 'WordPress', category: 'publishing', description: 'WordPress site', website: 'wordpress.org', docs: 'developer.wordpress.org/rest-api', fields: ['site_url', 'username', 'app_password'] },
    { key: 'make', label: 'Make', category: 'automation', description: 'Workflow automation', website: 'make.com', docs: 'make.com/en/help/webhooks', fields: ['webhook_url'], register_url: 'https://make.com' },
    { key: 'supabase', label: 'Supabase', category: 'database', description: 'PostgreSQL database', website: 'supabase.com', docs: 'supabase.com/docs', fields: ['project_url', 'api_key'], register_url: 'https://supabase.com' },
  ];

  const result = defaults.map((def) => {
    const dbRow = get('SELECT * FROM integrations WHERE key = ?', [def.key]);
    const config = dbRow ? JSON.parse((dbRow as any).config || '{}') : {};
    const configKeys = Object.keys(config);
    return {
      ...def,
      connected: dbRow ? (dbRow as any).connected === 1 : false,
      config_keys: configKeys,
      meta: dbRow ? JSON.parse((dbRow as any).meta || '{}') : {},
      updated_at: dbRow ? (dbRow as any).updated_at : null,
    };
  });

  res.json(result);
});

// POST /api/integrations/:key/connect
router.post('/:key/connect', (req: Request, res: Response) => {
  const { key } = req.params;
  const config = req.body;

  try {
    const existing = get('SELECT id FROM integrations WHERE key = ?', [key]);
    const now = new Date().toISOString();

    if (existing) {
      run('UPDATE integrations SET config = ?, connected = 1, updated_at = ? WHERE key = ?', [
        JSON.stringify(config),
        now,
        key,
      ]);
    } else {
      run('INSERT INTO integrations (key, label, category, connected, config, updated_at) VALUES (?, ?, ?, 1, ?, ?)', [
        key,
        key,
        'other',
        JSON.stringify(config),
        now,
      ]);
    }

    res.json({ key, connected: true, message: 'Připojeno' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Chyba připojení' });
  }
});

// DELETE /api/integrations/:key
router.delete('/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  try {
    const now = new Date().toISOString();
    run('UPDATE integrations SET connected = 0, config = ?, updated_at = ? WHERE key = ?', ['{}', now, key]);
    res.json({ key, connected: false });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Chyba odpojení' });
  }
});

export default router;
