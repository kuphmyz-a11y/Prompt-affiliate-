import express, { Request, Response } from 'express';
import logger from '../lib/logger.js';

const router = express.Router();

router.get('/healthz', (req: Request, res: Response) => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasWordPress = !!process.env.WORDPRESS_URL && !!process.env.WORDPRESS_USER && !!process.env.WORDPRESS_APP_PASSWORD;
  const hasNamecheap = !!process.env.NAMECHEAP_API_KEY && !!process.env.NAMECHEAP_USERNAME;
  const hasMake = !!process.env.MAKE_WEBHOOK_URL;

  res.json({
    status: 'ok',
    mode: hasOpenAI ? 'online' : 'offline',
    apis: {
      openai: hasOpenAI,
      wordpress: hasWordPress,
      namecheap: hasNamecheap,
      make: hasMake,
    },
  });
});

export default router;
