import { randomBytes } from 'crypto';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Acquire a short-lived distributed lock in Redis. The lock is released only
 * by the holder (token check before DEL) so a slow caller cannot delete
 * somebody else's lock. If Redis is unavailable, the lock degrades to a no-op
 * and the callback runs anyway — safe for single-instance deployments.
 *
 * Returns `null` when the lock is held by another instance.
 */
export async function withLock<T>(
  key: string,
  ttlSec: number,
  fn: () => Promise<T>
): Promise<T | null> {
  if (redis.status !== 'ready') {
    return fn();
  }
  const token = randomBytes(12).toString('hex');
  const acquired = await redis.set(key, token, 'EX', ttlSec, 'NX');
  if (acquired !== 'OK') {
    logger.info('Lock not acquired — held by another instance', { key });
    return null;
  }
  try {
    return await fn();
  } finally {
    const current = await redis.get(key);
    if (current === token) await redis.del(key);
  }
}
