import 'dotenv/config';
import app from './app.js';
import logger from './lib/logger.js';
import { migrate } from '../scripts/migrate.js';

try {
  migrate();
  logger.info('Database migrated successfully');
} catch (err) {
  logger.error('Migration failed:', err);
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  logger.info(`Backend running on http://localhost:${PORT}`);
});
