import { Router, Request, Response } from 'express';
import { query, get, run } from '../db/index.js';
import logger from '../lib/logger.js';

const router = Router();

// GET /api/domains
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, market, segment, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM domains WHERE 1=1';
    const params: any[] = [];
    
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
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const domains = query(sql, params);
    res.json(domains);
  } catch (err) {
    logger.error('Error getting domains:', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/domains
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, buy_url, status = 'idea' } = req.body;
    const result = run(
      'INSERT INTO domains (name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, buy_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, buy_url, status]
    );
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    logger.error('Error creating domain:', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/domains/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const domain = get('SELECT * FROM domains WHERE id = ?', [req.params.id]);
    if (!domain) return res.status(404).json({ error: 'Not found' });
    res.json(domain);
  } catch (err) {
    logger.error('Error getting domain:', err);
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/domains/:id
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = Object.values(updates);
    run(`UPDATE domains SET ${fields}, updated_at = datetime('now') WHERE id = ?`, [...values, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error updating domain:', err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/domains/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    run('DELETE FROM domains WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting domain:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
