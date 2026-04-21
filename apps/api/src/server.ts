import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDB, disconnectDB } from './config/db';
import { initRedis, redis } from './config/redis';
import { startBillingJob } from './jobs/billing.job';

async function main() {
  await connectDB();
  await initRedis();

  const app = buildApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`${env.APP_NAME} API listening on :${env.PORT} (${env.NODE_ENV})`);
  });

  startBillingJob();

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(() => logger.info('HTTP server closed'));
    try {
      await disconnectDB();
      if (redis.status === 'ready') await redis.quit();
    } catch (err) {
      logger.error('Error during shutdown', { err: (err as Error).message });
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error('unhandledRejection', { reason }));
  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', { err: err.message, stack: err.stack });
    // Let PM2/Docker restart us cleanly.
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error('Fatal startup error', { err: (err as Error).message, stack: (err as Error).stack });
  process.exit(1);
});
