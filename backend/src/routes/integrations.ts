import { Router, Request, Response } from 'express';
import { query, get, run } from '../db/index.js';
import logger from '../lib/logger.js';

const router = Router();

const integrationDefaults = [
  { key: 'wordpress', label: 'WordPress', category: 'publishing', description: 'Website platform', website: 'https://wordpress.org', fields: ['site_url', 'username', 'app_password'] },
  { key: 'namecheap', label: 'Namecheap', category: 'domains', description: 'Domain registrar', website: 'https://namecheap.com', fields: ['api_key', 'username'] },
  { key: 'cloudflare', label: 'Cloudflare', category: 'hosting', description: 'DNS and CDN', website: 'https://cloudflare.com', fields: ['api_key', 'email'] },
  { key: 'google_gsc', label: 'Google Search Console', category: 'seo', description: 'SEO monitoring', website: 'https://search.google.com/search-console', fields: ['property_url'] },
  { key: 'google_ga4', label: 'Google Analytics 4', category: 'analytics', description: 'Website analytics', website: 'https://analytics.google.com', fields: ['measurement_id'] },
  { key: 'dataforseo', label: 'DataForSEO', category: 'seo', description: 'SEO API', website: 'https://dataforseo.com', fields: ['login', 'password'] },
  { key: 'awin', label: 'Awin', category: 'affiliate', description: 'Affiliate network', website: 'https://awin.com', fields: ['publisher_id', 'api_key'] },
  { key: 'cj', label: 'Commission Junction', category: 'affiliate', description: 'Affiliate network', website: 'https://cj.com', fields: ['publisher_id', 'api_key'] },
  { key: 'impact', label: 'Impact', category: 'affiliate', description: 'Affiliate network', website: 'https://impact.com', fields: ['account_id', 'api_key'] },
  { key: 'clickbank', label: 'ClickBank', category: 'affiliate', description: 'Digital products', website: 'https://clickbank.com', fields: ['account_id', 'api_key'] },
  { key: 'amazon_assoc', label: 'Amazon Associates', category: 'affiliate', description: 'Amazon affiliate', website: 'https://amazon.com/associates', fields: ['associate_id', 'access_key'] },
  { key: 'convertkit', label: 'ConvertKit', category: 'email', description: 'Email marketing', website: 'https://convertkit.com', fields: ['api_key'] },
  { key: 'make', label: 'Make (Integromat)', category: 'automation', description: 'Automation platform', website: 'https://make.com', fields: ['webhook_url'] },
  { key: 'uptime_robot', label: 'Uptime Robot', category: 'monitoring', description: 'Uptime monitoring', website: 'https://uptimerobot.com', fields: ['api_key'] },
  { key: 'supabase', label: 'Supabase', category: 'database', description: 'PostgreSQL database', website: 'https://supabase.com', fields: ['project_url', 'api_key'] },
];

// GET /api/integrations
router.get('/', (req: Request, res: Response) => {
  try {
    const dbIntegrations = query('SELECT * FROM integrations');
    const dbMap = new Map(dbIntegrations.map((i: any) => [i.key, i]));
    
    const result = integrationDefaults.map((def) => {
      const db = dbMap.get(def.key);
      return {
        ...def,
        connected: db?.connected || false,
        config_keys: def.fields,
        meta: db?.meta ? JSON.parse(db.meta) : {},
        updated_at: db?.updated_at || new Date().toISOString(),
      };
    });
    
    res.json(result);
  } catch (err) {
    logger.error('Error getting integrations:', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/integrations/:key/connect
router.post('/:key/connect', (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const config = req.body;
    
    const existing = get('SELECT * FROM integrations WHERE key = ?', [key]);
    
    if (existing) {
      run('UPDATE integrations SET config = ?, connected = 1, updated_at = datetime("now") WHERE key = ?', [
        JSON.stringify(config),
        key,
      ]);
    } else {
      run('INSERT INTO integrations (key, label, category, config, connected) VALUES (?, ?, ?, ?, 1)', [
        key,
        integrationDefaults.find((d) => d.key === key)?.label || key,
        integrationDefaults.find((d) => d.key === key)?.category || 'other',
        JSON.stringify(config),
      ]);
    }
    
    res.json({ key, connected: true, message: 'Connected' });
  } catch (err) {
    logger.error('Error connecting integration:', err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/integrations/:key
router.delete('/:key', (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    run('UPDATE integrations SET connected = 0, config = "{}" WHERE key = ?', [key]);
    res.json({ key, connected: false });
  } catch (err) {
    logger.error('Error disconnecting integration:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
