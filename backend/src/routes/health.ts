import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const openaiKey = !!process.env.OPENAI_API_KEY;
  const wordpressUrl = !!process.env.WORDPRESS_URL;
  const namecheapKey = !!process.env.NAMECHEAP_API_KEY;
  const makeUrl = !!process.env.MAKE_WEBHOOK_URL;

  res.json({
    status: 'ok',
    mode: openaiKey ? 'online' : 'offline',
    apis: {
      openai: openaiKey,
      wordpress: wordpressUrl,
      namecheap: namecheapKey,
      make: makeUrl,
    },
  });
});

export default router;
