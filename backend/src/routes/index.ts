import { Router } from 'express';
import healthRouter from './health.js';
import scanRouter from './scan.js';
import integrationsRouter from './integrations.js';
import pipelineRouter from './pipeline.js';
import wordpressRouter from './wordpress.js';

const router = Router();

router.use('/healthz', healthRouter);
router.use('/scan', scanRouter);
router.use('/integrations', integrationsRouter);
router.use('/agent', pipelineRouter);
router.use('/wordpress', wordpressRouter);

export default router;