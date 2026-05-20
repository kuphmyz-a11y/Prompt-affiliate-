import { Router, Request, Response } from 'express';
import { query, get, run } from '../db/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import logger from '../lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

function startSSE(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

function sendEvent(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function loadMock(filename: string) {
  const mockPath = path.join(__dirname, '../../mocks', filename);
  return JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
}

// POST /api/scan/markets
router.post('/markets', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  try {
    const mock = loadMock('trends.json');
    sendEvent(res, { type: 'chunk', content: JSON.stringify(mock, null, 2) });
    sendEvent(res, { type: 'done', output: mock });
    res.end();
  } catch (err) {
    logger.error('Error in /markets:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/scan/market-trends
router.post('/market-trends', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  try {
    const mock = loadMock('trends.json');
    const output = {
      market: req.body.name || 'Unknown',
      language: req.body.language || 'cs',
      trends: [
        {
          id: '1',
          name: 'Online Loans',
          name_local: 'Půjčky Online',
          category: 'Finance',
          search_est: 45000,
          epc_usd: 35,
          commission_pct: 5,
          trend_score: 85,
          competition: 45,
          direction: 'up',
          why: 'Growing demand for instant loans',
        },
      ],
    };
    sendEvent(res, { type: 'chunk', content: JSON.stringify(output, null, 2) });
    sendEvent(res, { type: 'done', output });
    res.end();
  } catch (err) {
    logger.error('Error in /market-trends:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/scan/trend-deep
router.post('/trend-deep', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  try {
    const output = {
      trend: req.body.trend_name || 'Loans',
      trend_local: req.body.trend_name_local || 'Půjčky',
      market: req.body.market_name || 'Czech Republic',
      language: req.body.language || 'cs',
      search_volume_est: 45000,
      competition_score: 45,
      epc_usd: 35,
      commission_pct: 5,
      affiliate_programs: [
        { name: 'Vivus', url: 'https://vivus.cz', commission_pct: 5, epc_usd: 30 },
        { name: 'Ferratum', url: 'https://ferratum.cz', commission_pct: 4, epc_usd: 25 },
      ],
      content_angles: ['Comparison', 'How to Apply', 'Calculator', 'Reviews'],
      domain_keywords: ['loans', 'fast loans', 'instant loans'],
      why_now: 'Growing demand for digital financial products',
      risk_level: 'medium',
    };
    sendEvent(res, { type: 'chunk', content: JSON.stringify(output, null, 2) });
    sendEvent(res, { type: 'done', output });
    res.end();
  } catch (err) {
    logger.error('Error in /trend-deep:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/scan/domains
router.post('/domains', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  try {
    const mock = loadMock('domains.json');
    sendEvent(res, { type: 'chunk', content: JSON.stringify(mock, null, 2) });
    sendEvent(res, { type: 'done', output: mock });
    res.end();
  } catch (err) {
    logger.error('Error in /domains:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/scan/domain-setup
router.post('/domain-setup', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  try {
    const mock = loadMock('compliance.json');
    sendEvent(res, { type: 'chunk', content: JSON.stringify(mock, null, 2) });
    sendEvent(res, { type: 'done', output: mock });
    res.end();
  } catch (err) {
    logger.error('Error in /domain-setup:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/scan/content-generate
router.post('/content-generate', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  try {
    const mock = loadMock('content.json');
    sendEvent(res, { type: 'chunk', content: JSON.stringify(mock, null, 2) });
    sendEvent(res, { type: 'done', output: mock });
    res.end();
  } catch (err) {
    logger.error('Error in /content-generate:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// GET /api/scan/sessions
router.get('/sessions', (req: Request, res: Response) => {
  try {
    const sessions = query('SELECT * FROM scan_sessions ORDER BY created_at DESC');
    res.json(sessions);
  } catch (err) {
    logger.error('Error getting sessions:', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/scan/sessions
router.post('/sessions', (req: Request, res: Response) => {
  try {
    const { name, status = 'running', blocked_countries = '[]', preferred_tlds = '[]', max_price_usd = 10 } = req.body;
    const result = run(
      'INSERT INTO scan_sessions (name, status, blocked_countries, preferred_tlds, max_price_usd) VALUES (?, ?, ?, ?, ?)',
      [name, status, JSON.stringify(blocked_countries), JSON.stringify(preferred_tlds), max_price_usd]
    );
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    logger.error('Error creating session:', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/scan/sessions/:id
router.get('/sessions/:id', (req: Request, res: Response) => {
  try {
    const session = get('SELECT * FROM scan_sessions WHERE id = ?', [req.params.id]);
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json(session);
  } catch (err) {
    logger.error('Error getting session:', err);
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/scan/sessions/:id
router.patch('/sessions/:id', (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = Object.values(updates);
    run(`UPDATE scan_sessions SET ${fields}, updated_at = datetime('now') WHERE id = ?`, [...values, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error updating session:', err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/scan/sessions/:id
router.delete('/sessions/:id', (req: Request, res: Response) => {
  try {
    run('DELETE FROM scan_sessions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting session:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
