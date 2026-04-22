import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('error', (err) => logger.error('Redis error', { err: err.message }));
redis.on('connect', () => logger.info('Redis connected'));

export async function initRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (err) {
    logger.warn('Redis unavailable — continuing without it. Rate limiting will use in-memory store.', {
      err: (err as Error).message,
    });
  }
}
