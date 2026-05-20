import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import logger from './lib/logger.js';
import router from './routes/index.js';

const app = express();

app.use(pinoHttp({ logger }));
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

app.use('/api', router);

export default app;
