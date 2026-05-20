import { Router, Request, Response } from 'express';
import { query, run, get, transaction } from '../db/index.js';

const router = Router();

const SYSTEM_PROMPT = `You are a Global Affiliate Factory Agent. Your mission: design an automated factory of small, cheap, highly targeted affiliate websites. Goal: 100+ sites/year. Max cost: ≤10 USD/year per site. Target EPC: 15–150 USD. Respond only in valid JSON format.`;

// GET /agent/prompt
router.get('/prompt', (req: Request, res: Response) => {
  res.json({
    system_prompt: SYSTEM_PROMPT,
    behavior_rules: ['Always respond in JSON', 'Focus on cost efficiency', 'Prioritize EPC potential'],
    pipeline_steps: ['trend_radar', 'scan_world', 'select_top_markets', 'generate_domains', 'generate_site', 'compliance_pack'],
    version: '2.5-affiliate-factory',
    changelog: 'Initial release',
  });
});

// GET /agent/config
router.get('/config', (req: Request, res: Response) => {
  let config = get('SELECT data FROM agent_config WHERE id = ?', ['singleton']);
  
  if (!config) {
    const defaults = {
      model: 'gpt-4o-mini',
      provider: 'openai',
      max_cost_usd_per_site: 10,
      max_domain_price_usd: 5,
      blocked_countries: ['DE', 'FR'],
      preferred_tlds: ['.com', '.pl', '.es', '.online'],
      target_segments: ['loans', 'insurance', 'travel'],
      epc_weight: 50,
      volume_weight: 30,
      competition_weight: 20,
    };
    run('INSERT INTO agent_config (id, data) VALUES (?, ?)', ['singleton', JSON.stringify(defaults)]);
    config = { data: JSON.stringify(defaults) };
  }
  
  res.json(JSON.parse(config.data as string));
});

// PUT /agent/config
router.put('/config', (req: Request, res: Response) => {
  const data = JSON.stringify(req.body);
  run('UPDATE agent_config SET data = ?, updated_at = datetime(\'now\') WHERE id = ?', [data, 'singleton']);
  res.json(req.body);
});

// GET /agent/runs
router.get('/runs', (req: Request, res: Response) => {
  const limit = req.query.limit || 10;
  const runs = query('SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT ?', [limit]);
  res.json(runs);
});

// GET /agent/runs/:id
router.get('/runs/:id', (req: Request, res: Response) => {
  const run = get('SELECT * FROM pipeline_runs WHERE id = ?', [req.params.id]);
  if (!run) return res.status(404).json({ error: 'Not found' });
  res.json(run);
});

// POST /agent/invoke (SSE)
router.post('/invoke', (req: Request, res: Response) => {
  const { step, market, topic, previous_step_output, constraints } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const runId = run(
    'INSERT INTO pipeline_runs (step, market, topic, input, status) VALUES (?, ?, ?, ?, ?)',
    [step, market, topic, JSON.stringify(previous_step_output || {}), 'running']
  ).lastInsertRowid;
  
  res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);
  
  setTimeout(() => {
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: `Processing ${step}...` })}\n\n`);
  }, 100);
  
  setTimeout(() => {
    const output = { step, market, topic, status: 'success', generated_at: new Date().toISOString() };
    run('UPDATE pipeline_runs SET output = ?, status = ? WHERE id = ?', [JSON.stringify(output), 'done', runId]);
    res.write(`data: ${JSON.stringify({ type: 'done', output })}\n\n`);
    res.end();
  }, 500);
});

// POST /agent/install
router.post('/install', (req: Request, res: Response) => {
  const { agent_name, provider, model, make_webhook_url, markets, affiliate_networks } = req.body;
  
  const agentJson = {
    name: agent_name,
    version: '1.0',
    provider,
    model,
    system_prompt: SYSTEM_PROMPT,
    config: { make_webhook_url, markets, affiliate_networks },
  };
  
  const makeScenario = {
    name: agent_name,
    description: 'Affiliate Factory Agent',
    webhookUrl: make_webhook_url,
    modules: ['rest', 'json', 'text'],
  };
  
  res.json({
    success: true,
    agent_json: agentJson,
    make_scenario_json: makeScenario,
  });
});

export default router;
