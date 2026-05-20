import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasWordPress = !!(process.env.WORDPRESS_URL && process.env.WORDPRESS_USER);
  const hasNamecheap = !!(process.env.NAMECHEAP_API_KEY && process.env.NAMECHEAP_USERNAME);
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