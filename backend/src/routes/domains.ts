import { Router } from 'express';
import { query, run, get } from '../db/index.js';
import logger from '../lib/logger.js';

const router = Router();

// GET /api/domains
router.get('/', (req, res) => {
  try {
    const { status, market, segment, limit = '50', offset = '0' } = req.query;
    let sql = 'SELECT * FROM domains WHERE 1=1';
    const params: unknown[] = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (market) {
      sql += ' AND market = ?';
      params.push(market);
    }
    if (segment) {
      sql += ' AND segment = ?';
      params.push(segment);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const domains = query(sql, params);
    res.json(domains);
  } catch (err) {
    logger.error('domains list error', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/domains
router.post('/', (req, res) => {
  try {
    const { name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, buy_url, status } = req.body;
    const result = run(
      `INSERT INTO domains (name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, buy_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, buy_url, status || 'idea']
    );
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    logger.error('domain create error', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/domains/:id
router.get('/:id', (req, res) => {
  try {
    const domain = get('SELECT * FROM domains WHERE id = ?', [req.params.id]);
    res.json(domain || {});
  } catch (err) {
    logger.error('domain get error', err);
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/domains/:id
router.patch('/:id', (req, res) => {
  try {
    const updates: string[] = [];
    const params: unknown[] = [];

    for (const [key, value] of Object.entries(req.body)) {
      if (key !== 'id') {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    params.push(req.params.id);
    updates.push('updated_at = datetime(\'now\')');

    run(`UPDATE domains SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) {
    logger.error('domain update error', err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/domains/:id
router.delete('/:id', (req, res) => {
  try {
    run('DELETE FROM domains WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('domain delete error', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;