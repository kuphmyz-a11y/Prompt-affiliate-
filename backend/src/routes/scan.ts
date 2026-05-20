import { Router, Request, Response } from 'express';
import { query, run, get } from '../db/index.js';
import logger from '../lib/logger.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

const mockTrends = JSON.parse(readFileSync(path.join(__dirname, '../../mocks/trends.json'), 'utf-8'));
const mockDomains = JSON.parse(readFileSync(path.join(__dirname, '../../mocks/domains.json'), 'utf-8'));
const mockContent = JSON.parse(readFileSync(path.join(__dirname, '../../mocks/content.json'), 'utf-8'));
const mockCompliance = JSON.parse(readFileSync(path.join(__dirname, '../../mocks/compliance.json'), 'utf-8'));

function startSSE(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

function sendEvent(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// POST /scan/markets
router.post('/markets', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  setTimeout(() => {
    sendEvent(res, { type: 'chunk', content: 'Analyzing markets...' });
  }, 100);
  
  setTimeout(() => {
    sendEvent(res, { type: 'done', output: mockTrends });
    res.end();
  }, 500);
});

// POST /scan/market-trends
router.post('/market-trends', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  setTimeout(() => {
    sendEvent(res, { type: 'chunk', content: 'Scanning trends...' });
  }, 100);
  
  setTimeout(() => {
    const output = {
      market: req.body.iso,
      language: req.body.language,
      trends: [
        { id: 1, name: 'loans', name_local: 'pożyczki', category: 'finance', search_est: 50000, epc_usd: 25, commission_pct: 5, trend_score: 85, competition: 45, direction: 'up', why: 'Growing demand' },
        { id: 2, name: 'insurance', name_local: 'ubezpieczenia', category: 'finance', search_est: 30000, epc_usd: 35, commission_pct: 8, trend_score: 78, competition: 38, direction: 'stable', why: 'Consistent demand' },
      ],
    };
    sendEvent(res, { type: 'done', output });
    res.end();
  }, 500);
});

// POST /scan/trend-deep
router.post('/trend-deep', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  setTimeout(() => {
    sendEvent(res, { type: 'chunk', content: 'Deep analyzing trend...' });
  }, 100);
  
  setTimeout(() => {
    const output = {
      trend: req.body.trend_name,
      trend_local: req.body.trend_name_local,
      market: req.body.market_iso,
      language: req.body.language,
      search_volume_est: 50000,
      competition_score: 45,
      epc_usd: 25,
      commission_pct: 5,
      affiliate_programs: [
        { name: 'Vivus', url: 'https://vivus.pl', commission_pct: 5, epc_usd: 20 },
        { name: 'Ferratum', url: 'https://ferratum.pl', commission_pct: 6, epc_usd: 25 },
      ],
      content_angles: ['Best loans comparison', 'Fast loans without paperwork', 'Loans for bad credit'],
      domain_keywords: ['pożyczki', 'szybka pożyczka', 'chwilówka'],
      why_now: 'High seasonal demand',
      risk_level: 'low',
    };
    sendEvent(res, { type: 'done', output });
    res.end();
  }, 500);
});

// POST /scan/domains
router.post('/domains', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  setTimeout(() => {
    sendEvent(res, { type: 'chunk', content: 'Generating domains...' });
  }, 100);
  
  setTimeout(() => {
    sendEvent(res, { type: 'done', output: mockDomains });
    res.end();
  }, 500);
});

// POST /scan/domain-setup
router.post('/domain-setup', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  setTimeout(() => {
    sendEvent(res, { type: 'chunk', content: 'Setting up domain...' });
  }, 100);
  
  setTimeout(() => {
    sendEvent(res, { type: 'done', output: mockCompliance });
    res.end();
  }, 500);
});

// POST /scan/content-generate
router.post('/content-generate', (req: Request, res: Response) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });
  
  setTimeout(() => {
    sendEvent(res, { type: 'chunk', content: 'Generating content...' });
  }, 100);
  
  setTimeout(() => {
    sendEvent(res, { type: 'done', output: mockContent });
    res.end();
  }, 500);
});

// GET /scan/sessions
router.get('/sessions', (req: Request, res: Response) => {
  const sessions = query('SELECT * FROM scan_sessions ORDER BY created_at DESC');
  res.json(sessions);
});

// POST /scan/sessions
router.post('/sessions', (req: Request, res: Response) => {
  const { name, status = 'running', blocked_countries = [], preferred_tlds = [], max_price_usd = 10 } = req.body;
  const result = run(
    'INSERT INTO scan_sessions (name, status, blocked_countries, preferred_tlds, max_price_usd) VALUES (?, ?, ?, ?, ?)',
    [name, status, JSON.stringify(blocked_countries), JSON.stringify(preferred_tlds), max_price_usd]
  );
  res.json({ id: result.lastInsertRowid });
});

// GET /scan/sessions/:id
router.get('/sessions/:id', (req: Request, res: Response) => {
  const session = get('SELECT * FROM scan_sessions WHERE id = ?', [req.params.id]);
  if (!session) return res.status(404).json({ error: 'Not found' });
  res.json(session);
});

// PATCH /scan/sessions/:id
router.patch('/sessions/:id', (req: Request, res: Response) => {
  const updates = req.body;
  const setClauses = Object.keys(updates).map((key) => `${key} = ?`);
  const values = Object.values(updates);
  values.push(req.params.id);
  
  run(`UPDATE scan_sessions SET ${setClauses.join(', ')}, updated_at = datetime('now') WHERE id = ?`, values);
  res.json({ success: true });
});

// DELETE /scan/sessions/:id
router.delete('/sessions/:id', (req: Request, res: Response) => {
  run('DELETE FROM scan_sessions WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

export default router;
