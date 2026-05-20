import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import router from './routes/index.js';
import logger from './lib/logger.js';

const app = express();

app.use(pinoHttp({ logger }));
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', router);

// Health check without logging
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;