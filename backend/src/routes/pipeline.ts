import { Router, Request, Response } from 'express';
import { query, get, run } from '../db/index.js';
import logger from '../lib/logger.js';

const router = Router();

const systemPrompt = `You are the Global Affiliate Factory Agent v2.5. Your goal is to design an automated factory of small, cheap, highly targeted affiliate websites. Constraints: 100+ sites/year, max $10/year per site, target EPC $15-150.`;

const pipelineSteps = [
  'trend_radar',
  'scan_world',
  'select_top_markets',
  'generate_domains',
  'generate_site',
  'compliance_pack',
];

// GET /api/agent/prompt
router.get('/prompt', (req: Request, res: Response) => {
  res.json({
    system_prompt: systemPrompt,
    behavior_rules: ['Focus on emerging markets', 'Prioritize low-competition niches', 'Maximize ROI'],
    user_template: 'Analyze market: {market}. Find trends with high EPC and low competition.',
    task_router: pipelineSteps,
    pipeline_steps: pipelineSteps,
    version: '2.5-affiliate-factory',
    changelog: [
      { version: '2.5', date: '2025-01-20', changes: ['Added Czech language support', 'Improved mock fallback'] },
    ],
  });
});

// GET /api/agent/config
router.get('/config', (req: Request, res: Response) => {
  try {
    let config = get('SELECT data FROM agent_config WHERE id = "singleton"');
    if (!config) {
      run('INSERT INTO agent_config (id, data) VALUES ("singleton", ?)', [
        JSON.stringify({
          model: 'gpt-4o-mini',
          provider: 'openai',
          max_cost_usd_per_site: 10,
          max_domain_price_usd: 10,
          blocked_countries: ['DE', 'FR'],
          preferred_tlds: ['.com', '.cz', '.pl'],
          target_segments: ['loans', 'insurance'],
          epc_weight: 60,
          volume_weight: 30,
          competition_weight: 10,
        }),
      ]);
      config = get('SELECT data FROM agent_config WHERE id = "singleton"');
    }
    res.json(JSON.parse(config.data));
  } catch (err) {
    logger.error('Error getting config:', err);
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/agent/config
router.put('/config', (req: Request, res: Response) => {
  try {
    const config = req.body;
    run('UPDATE agent_config SET data = ?, updated_at = datetime("now") WHERE id = "singleton"', [JSON.stringify(config)]);
    res.json(config);
  } catch (err) {
    logger.error('Error updating config:', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/agent/runs
router.get('/runs', (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const runs = query('SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json(runs);
  } catch (err) {
    logger.error('Error getting runs:', err);
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/agent/runs/:id
router.get('/runs/:id', (req: Request, res: Response) => {
  try {
    const run_data = get('SELECT * FROM pipeline_runs WHERE id = ?', [req.params.id]);
    if (!run_data) return res.status(404).json({ error: 'Not found' });
    res.json(run_data);
  } catch (err) {
    logger.error('Error getting run:', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/agent/invoke
router.post('/invoke', (req: Request, res: Response) => {
  const { step, market, topic } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    const output = { step, market, topic, status: 'completed', message: `${step} executed successfully` };
    
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: JSON.stringify(output, null, 2) })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done', output })}\n\n`);
    
    run('INSERT INTO pipeline_runs (step, market, topic, output, status) VALUES (?, ?, ?, ?, "done")', [
      step,
      market || null,
      topic || null,
      JSON.stringify(output),
    ]);
    
    res.end();
  } catch (err) {
    logger.error('Error invoking agent:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`);
    res.end();
  }
});

// POST /api/agent/install
router.post('/install', (req: Request, res: Response) => {
  try {
    const { agent_name, provider = 'openai', model = 'gpt-4o-mini', make_webhook_url } = req.body;
    
    const agentJson = {
      name: agent_name,
      version: '2.5-affiliate-factory',
      provider,
      model,
      system_prompt: systemPrompt,
      pipeline_steps: pipelineSteps,
    };
    
    const makeJson = {
      name: agent_name,
      webhookUrl: make_webhook_url,
      workflows: pipelineSteps.map((step) => ({
        name: step,
        endpoint: `/api/agent/invoke`,
        method: 'POST',
      })),
    };
    
    res.json({
      success: true,
      agent_json: agentJson,
      make_scenario_json: makeJson,
    });
  } catch (err) {
    logger.error('Error installing agent:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
