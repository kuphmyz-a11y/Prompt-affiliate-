import 'dotenv/config';
import app from './app.js';
import { migrate } from '../scripts/migrate.js';
import logger from './lib/logger.js';

// Run migrations
migrate();

const PORT = parseInt(process.env.PORT || '3000');
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Backend running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});