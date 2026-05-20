import { Router, Response } from 'express';
import { query, run, get } from '../db/index.js';
import logger from '../lib/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

const SYSTEM_PROMPT = `You are the Global Affiliate Factory Agent v2.5.
Your mission: Design an automated factory of small, cheap, highly targeted affiliate websites.
Goal: 100+ sites/year. Max cost: ≤10 USD/year per site. Target EPC: 15-150 USD.
Be specific, actionable, and focus on profitability.`;

// GET /api/agent/prompt
router.get('/prompt', (req, res) => {
  res.json({
    system_prompt: SYSTEM_PROMPT,
    behavior_rules: [
      'Always recommend low-cost TLDs',
      'Focus on underserved markets',
      'Use AI for content generation',
      'Automate domain purchases',
    ],
    task_router: {
      trend_radar: 'Analyze global trends',
      scan_world: 'Find best markets',
      select_top_markets: 'Filter top 10',
      generate_domains: 'Suggest domain names',
      generate_site: 'Create content outline',
      compliance_pack: 'Legal & SEO requirements',
    },
    pipeline_steps: [
      'trend_radar',
      'scan_world',
      'select_top_markets',
      'generate_domains',
      'generate_site',
      'compliance_pack',
    ],
    version: '2.5-affiliate-factory',
    changelog: 'v2.5: Added hybrid mock mode. v2.4: SQLite support. v2.3: OpenAI integration.',
  });
});

// GET /api/agent/config
router.get('/config', (req, res) => {
  try {
    const config = get('SELECT data FROM agent_config WHERE id = "singleton"');
    const data = config ? JSON.parse((config as any).data) : getDefaultConfig();
    res.json(data);
  } catch (err) {
    logger.error('config get error', err);
    res.json(getDefaultConfig());
  }
});

function getDefaultConfig() {
  return {
    model: 'gpt-4o-mini',
    provider: 'openai',
    max_cost_usd_per_site: 10,
    max_domain_price_usd: 9.99,
    blocked_countries: ['DE', 'FR'],
    preferred_tlds: ['.com', '.pl', '.es', '.online'],
    target_segments: ['loans', 'insurance', 'travel'],
    epc_weight: 40,
    volume_weight: 35,
    competition_weight: 25,
  };
}

// PUT /api/agent/config
router.put('/config', (req, res) => {
  try {
    const data = JSON.stringify(req.body);
    const existing = get('SELECT id FROM agent_config WHERE id = "singleton"');
    if (existing) {
      run('UPDATE agent_config SET data = ? WHERE id = "singleton"', [data]);
    } else {
      run('INSERT INTO agent_config (id, data) VALUES ("singleton", ?)', [data]);
    }
    res.json(req.body);
  } catch (err) {
    logger.error('config update error', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/agent/runs
router.get('/runs', (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const runs = query('SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json(runs);
  } catch (err) {
    logger.error('runs list error', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/agent/runs/:id
router.get('/runs/:id', (req, res) => {
  try {
    const run = get('SELECT * FROM pipeline_runs WHERE id = ?', [req.params.id]);
    res.json(run || {});
  } catch (err) {
    logger.error('run get error', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/agent/invoke
router.post('/invoke', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  (async () => {
    try {
      const { step, market, topic } = req.body;
      res.write('data: {"type":"start"}\n\n');

      const result = run(
        'INSERT INTO pipeline_runs (step, market, status) VALUES (?, ?, "running")',
        [step, market]
      );

      res.write(`data: {"type":"chunk","content":"Running step: ${step}"}\n\n`);

      // Simulate AI response
      await new Promise((r) => setTimeout(r, 500));

      run('UPDATE pipeline_runs SET status = "done" WHERE id = ?', [result.lastInsertRowid]);

      res.write('data: {"type":"done","output":{"step":"' + step + '","status":"completed"}}\n\n');
      res.end();
    } catch (err) {
      logger.error('invoke error', err);
      res.write(`data: {"type":"error","message":"${String(err)}"}\n\n`);
      res.end();
    }
  })();
});

// POST /api/agent/install
router.post('/install', (req, res) => {
  try {
    const { agent_name, provider = 'openai', model = 'gpt-4o-mini', make_webhook_url, markets, affiliate_networks } = req.body;

    const agentJson = {
      name: agent_name,
      version: '2.5',
      provider,
      model,
      system_prompt: SYSTEM_PROMPT,
      markets: markets || [],
      affiliate_networks: affiliate_networks || [],
    };

    const makeScenarioJson = {
      name: agent_name + ' - Make Scenario',
      webhook_url: make_webhook_url,
      steps: ['fetch_markets', 'analyze_trends', 'generate_domains', 'publish_content'],
    };

    res.json({
      success: true,
      agent_json: agentJson,
      make_scenario_json: makeScenarioJson,
    });
  } catch (err) {
    logger.error('install error', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;