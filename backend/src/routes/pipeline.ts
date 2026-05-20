import { Router } from 'express';
import { OpenAI } from 'openai';
import logger from '../lib/logger.js';
import { query, run, get } from '../db/index.js';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `You are the Global Affiliate Factory Agent v2.5 - an expert in designing automated affiliate marketing operations. Your goal is to design small, highly-targeted affiliate websites for niche markets with maximum ROI and minimal operational cost.

Key Principles:
- Target budget: ≤$10 per site per year
- Target EPC: $15-$150 per visitor
- 100+ sites per year operation
- Fully automated pipeline
- Compliance-first approach`;

function startSSE(res: any) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

function sendEvent(res: any, data: any) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// GET /api/agent/prompt
router.get('/prompt', (req, res) => {
  res.json({
    system_prompt: systemPrompt,
    behavior_rules: [
      'Always prioritize user safety and compliance',
      'Focus on ROI and sustainability',
      'Automated scaling first',
      'Content quality over quantity',
    ],
    user_template: 'Design a new affiliate site for {market} targeting {segment}',
    task_router: ['trend_radar', 'scan_world', 'select_top_markets', 'generate_domains', 'generate_site', 'compliance_pack'],
    pipeline_steps: [
      { id: 'trend_radar', name: 'Trend Radar', description: 'Identify trending affiliate niches' },
      { id: 'scan_world', name: 'Scan World', description: 'Analyze global markets' },
      { id: 'select_top_markets', name: 'Select Markets', description: 'Pick best markets' },
      { id: 'generate_domains', name: 'Generate Domains', description: 'Suggest domain names' },
      { id: 'generate_site', name: 'Generate Site', description: 'Create site content' },
      { id: 'compliance_pack', name: 'Compliance', description: 'Ensure all legal requirements' },
    ],
    version: '2.5-affiliate-factory',
    changelog: [
      'v2.5: Added offline mode with mock data',
      'v2.4: SQLite support, improved SSE streaming',
      'v2.3: Multi-language content generation',
      'v2.2: Compliance automation',
      'v2.1: Initial release',
    ],
  });
});

// GET /api/agent/config
router.get('/config', (req, res) => {
  try {
    let config = get('SELECT data FROM agent_config WHERE id = "singleton"');

    if (!config) {
      const defaults = {
        model: 'gpt-4o-mini',
        provider: 'openai',
        max_cost_usd_per_site: 10,
        max_domain_price_usd: 9.99,
        blocked_countries: ['DE', 'FR'],
        preferred_tlds: ['.com', '.pl', '.es', '.online'],
        target_segments: ['loans', 'insurance', 'travel', 'ecommerce'],
        epc_weight: 50,
        volume_weight: 30,
        competition_weight: 20,
      };
      run(
        'INSERT INTO agent_config (id, data) VALUES (?, ?)',
        { ':id': 'singleton', ':data': JSON.stringify(defaults) }
      );
      return res.json(defaults);
    }

    res.json(JSON.parse(config.data));
  } catch (err) {
    logger.error('GET /agent/config error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/agent/config
router.put('/config', (req, res) => {
  try {
    run(
      'UPDATE agent_config SET data = ?, updated_at = datetime("now") WHERE id = "singleton"',
      { ':data': JSON.stringify(req.body) }
    );
    res.json(req.body);
  } catch (err) {
    logger.error('PUT /agent/config error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/agent/runs
router.get('/runs', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
    const runs = query(
      'SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT ?',
      { ':limit': limit }
    );
    res.json(runs);
  } catch (err) {
    logger.error('GET /agent/runs error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/agent/runs/:id
router.get('/runs/:id', (req, res) => {
  try {
    const run = get('SELECT * FROM pipeline_runs WHERE id = ?', { ':id': req.params.id });
    if (!run) return res.status(404).json({ error: 'Not found' });
    res.json(run);
  } catch (err) {
    logger.error('GET /agent/runs/:id error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/agent/invoke
router.post('/invoke', async (req, res) => {
  startSSE(res);
  sendEvent(res, { type: 'start' });

  try {
    const { step, market, topic, previous_step_output, constraints } = req.body;

    let fullContent = '';

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Execute step: ${step}\nMarket: ${market || 'N/A'}\nTopic: ${topic || 'N/A'}`,
          },
        ],
        stream: true,
        max_tokens: 2000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          sendEvent(res, { type: 'chunk', content });
        }
      }

      // Save to pipeline_runs
      run(
        'INSERT INTO pipeline_runs (step, market, topic, output, status) VALUES (?, ?, ?, ?, ?)',
        {
          ':step': step,
          ':market': market,
          ':topic': topic,
          ':output': JSON.stringify({ text: fullContent }),
          ':status': 'done',
        }
      );

      sendEvent(res, { type: 'done', output: { text: fullContent } });
    } catch (err) {
      logger.error('OpenAI error:', err);
      // Save error to pipeline_runs
      run(
        'INSERT INTO pipeline_runs (step, market, topic, status, error) VALUES (?, ?, ?, ?, ?)',
        {
          ':step': step,
          ':market': market,
          ':topic': topic,
          ':status': 'error',
          ':error': String(err),
        }
      );
      sendEvent(res, { type: 'error', message: String(err) });
    }

    res.end();
  } catch (err) {
    logger.error('POST /agent/invoke error:', err);
    sendEvent(res, { type: 'error', message: String(err) });
    res.end();
  }
});

// POST /api/agent/install
router.post('/install', (req, res) => {
  try {
    const { agent_name, provider, model, make_webhook_url, markets, affiliate_networks } = req.body;

    const agentJson = {
      name: agent_name,
      version: '2.5',
      provider,
      model,
      system_prompt: systemPrompt,
      pipeline_steps: ['trend_radar', 'scan_world', 'select_top_markets', 'generate_domains', 'generate_site', 'compliance_pack'],
      markets: markets || [],
      affiliate_networks: affiliate_networks || [],
    };

    const makeScenarioJson = {
      name: agent_name,
      webhook_url: make_webhook_url,
      modules: [
        { id: 'webhook', type: 'trigger', name: 'Webhook' },
        { id: 'http', type: 'action', name: 'HTTP Request' },
        { id: 'airtable', type: 'action', name: 'Airtable' },
      ],
    };

    res.json({
      success: true,
      agent_json: agentJson,
      make_scenario_json: makeScenarioJson,
    });
  } catch (err) {
    logger.error('POST /agent/install error:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
