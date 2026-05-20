import { Router, Request, Response } from 'express';
import { query, run, get } from '../db/index.js';

const router = Router();

const INTEGRATIONS_DEFAULTS = [
  { key: 'dataforseo', label: 'DataForSEO', category: 'seo', description: 'SEO & SERP tracking', website: 'dataforseo.com', docs: 'docs.dataforseo.com', fields: ['login', 'password'], register_url: 'https://dataforseo.com/sign-up' },
  { key: 'cloudflare', label: 'Cloudflare', category: 'hosting', description: 'CDN & DNS', website: 'cloudflare.com', docs: 'developers.cloudflare.com', fields: ['api_token'], register_url: 'https://dash.cloudflare.com/sign-up' },
  { key: 'google_gsc', label: 'Google Search Console', category: 'analytics', description: 'Search performance', website: 'search.google.com', docs: 'support.google.com/webmasters', fields: ['property_id'] },
  { key: 'google_ga4', label: 'Google Analytics 4', category: 'analytics', description: 'Website analytics', website: 'analytics.google.com', docs: 'support.google.com/analytics', fields: ['measurement_id'] },
  { key: 'namecheap', label: 'Namecheap', category: 'domains', description: 'Domain registrar', website: 'namecheap.com', docs: 'namecheap.com/support', fields: ['api_key', 'username'], register_url: 'https://www.namecheap.com/sign-up' },
  { key: 'impact', label: 'Impact', category: 'affiliate', description: 'Affiliate network', website: 'impact.com', docs: 'developers.impact.com', fields: ['account_sid', 'auth_token'] },
  { key: 'awin', label: 'Awin', category: 'affiliate', description: 'Affiliate network', website: 'awin.com', docs: 'awin.com/developers', fields: ['api_key'] },
  { key: 'cj', label: 'CJ Affiliate', category: 'affiliate', description: 'Affiliate network', website: 'cj.com', docs: 'cj.com/developers', fields: ['api_key'] },
  { key: 'clickbank', label: 'ClickBank', category: 'affiliate', description: 'Affiliate marketplace', website: 'clickbank.com', docs: 'api.clickbank.com', fields: ['dev_key', 'account_nickname'] },
  { key: 'amazon_assoc', label: 'Amazon Associates', category: 'affiliate', description: 'Amazon affiliate', website: 'amazon.com', docs: 'associates.amazon.com', fields: ['tracking_id'] },
  { key: 'convertkit', label: 'ConvertKit', category: 'email', description: 'Email marketing', website: 'convertkit.com', docs: 'developers.convertkit.com', fields: ['api_key'] },
  { key: 'uptime_robot', label: 'Uptime Robot', category: 'monitoring', description: 'Site monitoring', website: 'uptimerobot.com', docs: 'uptimerobot.com/api', fields: ['api_key'] },
  { key: 'wordpress', label: 'WordPress', category: 'publishing', description: 'Site publishing', website: 'wordpress.org', docs: 'developer.wordpress.org', fields: ['site_url', 'username', 'app_password'] },
  { key: 'make', label: 'Make', category: 'automation', description: 'Workflow automation', website: 'make.com', docs: 'make.com/docs', fields: ['webhook_url'] },
  { key: 'supabase', label: 'Supabase', category: 'database', description: 'PostgreSQL backend', website: 'supabase.com', docs: 'supabase.com/docs', fields: ['project_url', 'anon_key'] },
];

// GET /integrations
router.get('/', (req: Request, res: Response) => {
  const dbIntegrations = query('SELECT * FROM integrations');
  const dbMap = new Map(dbIntegrations.map((i: any) => [i.key, i]));
  
  const merged = INTEGRATIONS_DEFAULTS.map((def) => {
    const dbRow = dbMap.get(def.key);
    const config = dbRow ? JSON.parse(dbRow.config || '{}') : {};
    const configKeys = Object.keys(config);
    
    return {
      ...def,
      connected: dbRow?.connected === 1,
      config_keys: configKeys,
      meta: dbRow ? JSON.parse(dbRow.meta || '{}') : {},
      updated_at: dbRow?.updated_at,
    };
  });
  
  res.json(merged);
});

// POST /integrations/:key/connect
router.post('/:key/connect', (req: Request, res: Response) => {
  const config = JSON.stringify(req.body);
  const existing = get('SELECT id FROM integrations WHERE key = ?', [req.params.key]);
  
  if (existing) {
    run('UPDATE integrations SET connected = 1, config = ?, updated_at = datetime(\'now\') WHERE key = ?', [config, req.params.key]);
  } else {
    run('INSERT INTO integrations (key, label, category, connected, config) VALUES (?, ?, ?, 1, ?)',
      [req.params.key, req.params.key, 'other', config]);
  }
  
  res.json({ key: req.params.key, connected: true, message: 'Connected successfully' });
});

// DELETE /integrations/:key
router.delete('/:key', (req: Request, res: Response) => {
  run('UPDATE integrations SET connected = 0, config = \'{}\' WHERE key = ?', [req.params.key]);
  res.json({ key: req.params.key, connected: false });
});

export default router;
