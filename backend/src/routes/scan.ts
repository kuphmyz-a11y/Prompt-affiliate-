import { Router, Response } from 'express';
import { OpenAI } from 'openai';
import { query, run, get } from '../db/index.js';
import logger from '../lib/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockDir = path.join(__dirname, '../../mocks');

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

function loadMock(filename: string): unknown {
  try {
    const content = fs.readFileSync(path.join(mockDir, filename), 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    logger.warn(`Failed to load mock ${filename}`, e);
    return {};
  }
}

async function callOpenAI(systemPrompt: string, userPrompt: string, maxTokens = 6000): Promise<string> {
  const mockMode = process.env.MOCK_MODE === 'true';
  if (mockMode) {
    logger.info('[API] MOCK_MODE enabled');
    return JSON.stringify(loadMock('trends.json'));
  }

  if (!process.env.OPENAI_API_KEY) {
    logger.warn('[API] No OPENAI_API_KEY, using mock');
    return JSON.stringify(loadMock('trends.json'));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    });

    clearTimeout(timeout);
    return response.choices[0].message.content || '{}';
  } catch (err) {
    logger.warn('[API] OpenAI error, using mock', err);
    return JSON.stringify(loadMock('trends.json'));
  }
}

// POST /api/scan/markets
router.post('/markets', async (req, res) => {
  startSSE(res);
  try {
    sendEvent(res, { type: 'start' });

    const { blocked_countries = [], markets_count = 10 } = req.body;
    const systemPrompt = `You are an affiliate market analyst. Analyze global markets for affiliate opportunities.
Return JSON with markets array containing: iso, name, name_native, language, internet_penetration, bureaucracy_score, competition_score, affiliate_freedom_score, epc_potential_score, total_score, best_segments, notes, recommended.`;
    const userPrompt = `Find top ${markets_count} markets for affiliate marketing. Avoid: ${blocked_countries.join(', ')}. Return JSON.`;

    const result = await callOpenAI(systemPrompt, userPrompt);
    sendEvent(res, { type: 'chunk', content: result });
    sendEvent(res, { type: 'done', output: JSON.parse(result) });
  } catch (err) {
    logger.error('markets error', err);
    sendEvent(res, { type: 'error', message: String(err) });
  } finally {
    res.end();
  }
});

// POST /api/scan/sessions
router.post('/sessions', (req, res) => {
  try {
    const { name, blocked_countries = [], preferred_tlds = [], max_price_usd = 10 } = req.body;
    const result = run(
      `INSERT INTO scan_sessions (name, blocked_countries, preferred_tlds, max_price_usd, status) VALUES (?, ?, ?, ?, 'running')`,
      [name, JSON.stringify(blocked_countries), JSON.stringify(preferred_tlds), max_price_usd]
    );
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    logger.error('session create error', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/scan/sessions
router.get('/sessions', (req, res) => {
  try {
    const sessions = query('SELECT * FROM scan_sessions ORDER BY created_at DESC');
    res.json(sessions);
  } catch (err) {
    logger.error('sessions list error', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/scan/sessions/:id
router.get('/sessions/:id', (req, res) => {
  try {
    const session = get('SELECT * FROM scan_sessions WHERE id = ?', [req.params.id]);
    res.json(session || {});
  } catch (err) {
    logger.error('session get error', err);
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/scan/sessions/:id
router.patch('/sessions/:id', (req, res) => {
  try {
    const { status, markets_data, trends_data, domains_data } = req.body;
    run(
      `UPDATE scan_sessions SET status = ?, markets_data = ?, trends_data = ?, domains_data = ?, updated_at = datetime('now') WHERE id = ?`,
      [status, JSON.stringify(markets_data), JSON.stringify(trends_data), JSON.stringify(domains_data), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('session update error', err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/scan/sessions/:id
router.delete('/sessions/:id', (req, res) => {
  try {
    run('DELETE FROM scan_sessions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('session delete error', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;