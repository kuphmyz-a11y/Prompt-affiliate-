import { Router, Request, Response } from 'express';

const router = Router();

router.get('/healthz', (req: Request, res: Response) => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasWordPress = !!process.env.WORDPRESS_URL;
  const hasNamecheap = !!process.env.NAMECHEAP_API_KEY;
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
