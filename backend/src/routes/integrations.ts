import { Router } from 'express';
import { query, run, get } from '../db/index.js';
import logger from '../lib/logger.js';

const router = Router();

const INTEGRATIONS = [
  { key: 'dataforseo', label: 'DataForSEO', category: 'seo', description: 'SEO rank tracking', fields: ['login', 'password'] },
  { key: 'cloudflare', label: 'Cloudflare', category: 'hosting', description: 'CDN & DNS', fields: ['api_token'] },
  { key: 'google_gsc', label: 'Google Search Console', category: 'seo', description: 'Google Search Console', fields: ['api_key'] },
  { key: 'google_ga4', label: 'Google Analytics 4', category: 'analytics', description: 'Web analytics', fields: ['property_id'] },
  { key: 'namecheap', label: 'Namecheap', category: 'domains', description: 'Domain registrar', fields: ['api_key', 'username'] },
  { key: 'impact', label: 'Impact', category: 'affiliate', description: 'Affiliate network', fields: ['api_key'] },
  { key: 'awin', label: 'AWIN', category: 'affiliate', description: 'Affiliate network', fields: ['api_token'] },
  { key: 'cj', label: 'Commission Junction', category: 'affiliate', description: 'Affiliate network', fields: ['api_key'] },
  { key: 'clickbank', label: 'ClickBank', category: 'affiliate', description: 'Digital affiliate network', fields: ['api_key'] },
  { key: 'amazon_assoc', label: 'Amazon Associates', category: 'affiliate', description: 'Amazon affiliate', fields: ['tracking_id'] },
  { key: 'convertkit', label: 'ConvertKit', category: 'email', description: 'Email marketing', fields: ['api_key'] },
  { key: 'uptime_robot', label: 'Uptime Robot', category: 'monitoring', description: 'Uptime monitoring', fields: ['api_key'] },
  { key: 'wordpress', label: 'WordPress', category: 'publishing', description: 'WordPress self-hosted', fields: ['site_url', 'username', 'app_password'] },
  { key: 'make', label: 'Make', category: 'automation', description: 'Automation platform', fields: ['webhook_url'] },
  { key: 'supabase', label: 'Supabase', category: 'database', description: 'PostgreSQL database', fields: ['project_url', 'api_key'] },
];

// GET /api/integrations
router.get('/', (req, res) => {
  try {
    const result = INTEGRATIONS.map((int) => {
      const dbRow = get('SELECT * FROM integrations WHERE key = ?', [int.key]);
      return {
        ...int,
        connected: dbRow ? (dbRow as any).connected : false,
        config_keys: int.fields,
        updated_at: dbRow ? (dbRow as any).updated_at : null,
      };
    });
    res.json(result);
  } catch (err) {
    logger.error('integrations list error', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/integrations/:key/connect
router.post('/:key/connect', (req, res) => {
  try {
    const existing = get('SELECT * FROM integrations WHERE key = ?', [req.params.key]);
    const config = JSON.stringify(req.body);

    if (existing) {
      run('UPDATE integrations SET connected = 1, config = ? WHERE key = ?', [config, req.params.key]);
    } else {
      run('INSERT INTO integrations (key, label, category, connected, config) VALUES (?, ?, ?, 1, ?)', [
        req.params.key,
        INTEGRATIONS.find((i) => i.key === req.params.key)?.label || req.params.key,
        INTEGRATIONS.find((i) => i.key === req.params.key)?.category || 'other',
        config,
      ]);
    }

    res.json({ key: req.params.key, connected: true, message: 'Connected' });
  } catch (err) {
    logger.error('integration connect error', err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/integrations/:key
router.delete('/:key', (req, res) => {
  try {
    run('UPDATE integrations SET connected = 0, config = "{}" WHERE key = ?', [req.params.key]);
    res.json({ key: req.params.key, connected: false });
  } catch (err) {
    logger.error('integration delete error', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;