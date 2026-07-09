import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { connectDB } from './config/db';
import logger from './utils/logger';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`StreamSaga API listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    const shutdown = (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error(`Failed to start server: ${err instanceof Error ? err.stack : err}`);
    process.exit(1);
  }
}

bootstrap();
