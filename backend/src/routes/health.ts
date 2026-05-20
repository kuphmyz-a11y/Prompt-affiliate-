import { Router, Response } from 'express';

const router = Router();

router.get('/healthz', (req, res) => {
  const mode = process.env.OPENAI_API_KEY ? 'online' : 'offline';
  res.json({
    status: 'ok',
    mode,
    apis: {
      openai: !!process.env.OPENAI_API_KEY,
      wordpress: !!process.env.WORDPRESS_URL,
      namecheap: !!process.env.NAMECHEAP_API_KEY,
      make: !!process.env.MAKE_WEBHOOK_URL,
    },
  });
});

export default router;
