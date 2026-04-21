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
    // Atomic check-and-delete: only release the lock if we still own it.
    // A non-atomic GET + DEL would race with lock expiry and could delete
    // a lock that another instance has just acquired.
    const UNLOCK_SCRIPT =
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
    try {
      await redis.eval(UNLOCK_SCRIPT, 1, key, token);
    } catch (err) {
      logger.warn('Lock release failed', { key, err: (err as Error).message });
    }
  }
}
