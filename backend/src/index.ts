import 'dotenv/config';
import app from './app.js';
import { migrate } from '../scripts/migrate.js';
import logger from './lib/logger.js';

// Auto-migrate on start
migrate();

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  logger.info(`Backend running on http://localhost:${PORT}`);
});