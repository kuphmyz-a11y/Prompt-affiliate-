import { Router } from 'express';
import { OpenAI } from 'openai';
import logger from '../lib/logger.js';
import { query, run, get } from '../db/index.js';
import trendsData from '../mocks/trends.json' assert { type: 'json' };
import domainsData from '../mocks/domains.json' assert { type: 'json' };
import contentData from '../mocks/content.json' assert { type: 'json' };
import complianceData from '../mocks/compliance.json' assert { type: 'json' };

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function startSSE(res: any) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

function sendEvent(res: any, data: any) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function callWithFallback<T>(
  serviceName: string,
  apiFn: () => Promise<T>,
  mockFn: () => T
): Promise<T> {
  const mockMode = process.env.MOCK_MODE === 'true';
  if (mockMode) {
    logger.warn(`[API] MOCK_MODE: ${serviceName}`);
    return mockFn();
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const result = await apiFn();
    clearTimeout(timeout);
    return result;
  } catch (err) {
    logger.warn(`[API] Fallback to mock: ${serviceName}`, err);
    return mockFn();
  }
}

// POST /api/scan/markets
router.post('/markets', async (req, res) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });

  try {
    const result = await callWithFallback(
      'scan-markets',
      async () => {
        let fullContent = '';
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an affiliate market analyst. Respond only with valid JSON.',
            },
            {
              role: 'user',
              content: 'Analyze top markets for affiliate marketing.',
            },
          ],
          stream: true,
          response_format: { type: 'json_object' },
          max_tokens: 6000,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            sendEvent(res, { type: 'chunk', content });
          }
        }

        try {
          return JSON.parse(fullContent);
        } catch {
          const start = fullContent.indexOf('{');
          const end = fullContent.lastIndexOf('}');
          return JSON.parse(fullContent.slice(start, end + 1));
        }
      },
      () => trendsData
    );

    sendEvent(res, { type: 'done', output: result });
    res.end();
  } catch (err) {
    logger.error('scan/markets error:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/scan/market-trends
router.post('/market-trends', async (req, res) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });

  try {
    const result = await callWithFallback(
      'market-trends',
      async () => {
        let fullContent = '';
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a trend analyst. Return only valid JSON.',
            },
            {
              role: 'user',
              content: `Analyze trends for market: ${req.body.iso}`,
            },
          ],
          stream: true,
          response_format: { type: 'json_object' },
          max_tokens: 10000,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            sendEvent(res, { type: 'chunk', content });
          }
        }

        try {
          return JSON.parse(fullContent);
        } catch {
          const start = fullContent.indexOf('{');
          const end = fullContent.lastIndexOf('}');
          return JSON.parse(fullContent.slice(start, end + 1));
        }
      },
      () => trendsData
    );

    sendEvent(res, { type: 'done', output: result });
    res.end();
  } catch (err) {
    logger.error('scan/market-trends error:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/scan/trend-deep
router.post('/trend-deep', async (req, res) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });

  try {
    const result = await callWithFallback(
      'trend-deep',
      async () => {
        let fullContent = '';
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a deep trend analyzer. Return only valid JSON.',
            },
            {
              role: 'user',
              content: `Deep analysis for trend: ${req.body.trend_name}`,
            },
          ],
          stream: true,
          response_format: { type: 'json_object' },
          max_tokens: 8000,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            sendEvent(res, { type: 'chunk', content });
          }
        }

        try {
          return JSON.parse(fullContent);
        } catch {
          const start = fullContent.indexOf('{');
          const end = fullContent.lastIndexOf('}');
          return JSON.parse(fullContent.slice(start, end + 1));
        }
      },
      () => trendsData
    );

    sendEvent(res, { type: 'done', output: result });
    res.end();
  } catch (err) {
    logger.error('scan/trend-deep error:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/scan/domains
router.post('/domains', async (req, res) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });

  try {
    const result = await callWithFallback(
      'scan-domains',
      async () => {
        let fullContent = '';
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a domain suggestion expert. Return only valid JSON.',
            },
            {
              role: 'user',
              content: 'Suggest domain names for affiliate sites.',
            },
          ],
          stream: true,
          response_format: { type: 'json_object' },
          max_tokens: 6000,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            sendEvent(res, { type: 'chunk', content });
          }
        }

        try {
          return JSON.parse(fullContent);
        } catch {
          const start = fullContent.indexOf('{');
          const end = fullContent.lastIndexOf('}');
          return JSON.parse(fullContent.slice(start, end + 1));
        }
      },
      () => domainsData
    );

    sendEvent(res, { type: 'done', output: result });
    res.end();
  } catch (err) {
    logger.error('scan/domains error:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/scan/domain-setup
router.post('/domain-setup', async (req, res) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });

  try {
    const result = await callWithFallback(
      'domain-setup',
      async () => {
        let fullContent = '';
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a domain setup expert. Return only valid JSON with seo, legal, and affiliate fields.',
            },
            {
              role: 'user',
              content: `Setup domain: ${req.body.domain}`,
            },
          ],
          stream: true,
          response_format: { type: 'json_object' },
          max_tokens: 10000,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            sendEvent(res, { type: 'chunk', content });
          }
        }

        try {
          return JSON.parse(fullContent);
        } catch {
          const start = fullContent.indexOf('{');
          const end = fullContent.lastIndexOf('}');
          return JSON.parse(fullContent.slice(start, end + 1));
        }
      },
      () => complianceData
    );

    sendEvent(res, { type: 'done', output: result });
    res.end();
  } catch (err) {
    logger.error('scan/domain-setup error:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/scan/content-generate
router.post('/content-generate', async (req, res) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });

  try {
    const result = await callWithFallback(
      'content-generate',
      async () => {
        let fullContent = '';
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a content generator. Return only valid JSON.',
            },
            {
              role: 'user',
              content: `Generate content for: ${req.body.domain}`,
            },
          ],
          stream: true,
          response_format: { type: 'json_object' },
          max_tokens: 12000,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            sendEvent(res, { type: 'chunk', content });
          }
        }

        try {
          return JSON.parse(fullContent);
        } catch {
          const start = fullContent.indexOf('{');
          const end = fullContent.lastIndexOf('}');
          return JSON.parse(fullContent.slice(start, end + 1));
        }
      },
      () => contentData
    );

    sendEvent(res, { type: 'done', output: result });
    res.end();
  } catch (err) {
    logger.error('scan/content-generate error:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// GET /api/scan/sessions
router.get('/sessions', (req, res) => {
  try {
    const sessions = query(
      'SELECT * FROM scan_sessions ORDER BY created_at DESC LIMIT 100'
    );
    res.json(sessions);
  } catch (err) {
    logger.error('GET /sessions error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/scan/sessions
router.post('/sessions', (req, res) => {
  try {
    const { name, status = 'running', blocked_countries = [], preferred_tlds = [], max_price_usd = 10 } = req.body;
    const result = run(
      'INSERT INTO scan_sessions (name, status, blocked_countries, preferred_tlds, max_price_usd) VALUES (?, ?, ?, ?, ?)',
      {
        ':name': name,
        ':status': status,
        ':blocked_countries': JSON.stringify(blocked_countries),
        ':preferred_tlds': JSON.stringify(preferred_tlds),
        ':max_price_usd': max_price_usd,
      }
    );
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    logger.error('POST /sessions error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/scan/sessions/:id
router.get('/sessions/:id', (req, res) => {
  try {
    const session = get('SELECT * FROM scan_sessions WHERE id = ?', { ':id': req.params.id });
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json(session);
  } catch (err) {
    logger.error('GET /sessions/:id error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/scan/sessions/:id
router.patch('/sessions/:id', (req, res) => {
  try {
    const updates = Object.entries(req.body)
      .map(([k, v]) => `${k} = ?`)
      .join(', ');
    const values = Object.values(req.body);

    run(
      `UPDATE scan_sessions SET ${updates}, updated_at = datetime('now') WHERE id = ?`,
      { ...req.body, ':id': req.params.id }
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('PATCH /sessions/:id error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/scan/sessions/:id
router.delete('/sessions/:id', (req, res) => {
  try {
    run('DELETE FROM scan_sessions WHERE id = ?', { ':id': req.params.id });
    res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /sessions/:id error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/domains
router.get('/../../domains', (req, res) => {
  try {
    const { status, market, segment, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM domains WHERE 1=1';
    const params: any = {};

    if (status) {
      sql += ' AND status = :status';
      params[':status'] = status;
    }
    if (market) {
      sql += ' AND market = :market';
      params[':market'] = market;
    }
    if (segment) {
      sql += ' AND segment = :segment';
      params[':segment'] = segment;
    }

    sql += ' ORDER BY created_at DESC LIMIT :limit OFFSET :offset';
    params[':limit'] = limit;
    params[':offset'] = offset;

    const domains = query(sql, params);
    res.json(domains);
  } catch (err) {
    logger.error('GET /domains error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/domains
router.post('/../../domains', (req, res) => {
  try {
    const {
      name,
      tld,
      market,
      language,
      segment,
      keyword_local,
      score,
      price_usd,
      cpc_usd,
      epc_usd,
      buy_url,
      status = 'idea',
    } = req.body;

    const result = run(
      'INSERT INTO domains (name, tld, market, language, segment, keyword_local, score, price_usd, cpc_usd, epc_usd, buy_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      {
        ':name': name,
        ':tld': tld,
        ':market': market,
        ':language': language,
        ':segment': segment,
        ':keyword_local': keyword_local,
        ':score': score,
        ':price_usd': price_usd,
        ':cpc_usd': cpc_usd,
        ':epc_usd': epc_usd,
        ':buy_url': buy_url,
        ':status': status,
      }
    );
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    logger.error('POST /domains error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/domains/:id
router.get('/../../domains/:id', (req, res) => {
  try {
    const domain = get('SELECT * FROM domains WHERE id = ?', { ':id': req.params.id });
    if (!domain) return res.status(404).json({ error: 'Not found' });
    res.json(domain);
  } catch (err) {
    logger.error('GET /domains/:id error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/domains/:id
router.patch('/../../domains/:id', (req, res) => {
  try {
    const updates = Object.entries(req.body)
      .map(([k]) => `${k} = ?`)
      .join(', ');

    run(
      `UPDATE domains SET ${updates}, updated_at = datetime('now') WHERE id = ?`,
      { ...req.body, ':id': req.params.id }
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('PATCH /domains/:id error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/domains/:id
router.delete('/../../domains/:id', (req, res) => {
  try {
    run('DELETE FROM domains WHERE id = ?', { ':id': req.params.id });
    res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /domains/:id error:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
