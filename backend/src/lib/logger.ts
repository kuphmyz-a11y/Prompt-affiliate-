import pino from 'pino';

const level = process.env.LOG_LEVEL || 'info';

const logger = pino({
  level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export default logger;