import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { billingService } from '../services/billing.service';
import { redis } from '../config/redis';

/**
 * Distributed-safe cron lock: only one PM2/Docker instance runs billing per tick.
 */
async function withLock<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T | null> {
  if (redis.status !== 'ready') {
    // No Redis — run anyway (single-instance deploys).
    return fn();
  }
  const token = Math.random().toString(36).slice(2);
  const acquired = await redis.set(key, token, 'EX', ttlSec, 'NX');
  if (acquired !== 'OK') {
    logger.info('Billing job skipped — lock held by another instance');
    return null;
  }
  try {
    return await fn();
  } finally {
    const current = await redis.get(key);
    if (current === token) await redis.del(key);
  }
}

export function startBillingJob(): void {
  if (!cron.validate(env.BILLING_CRON)) {
    logger.error('Invalid BILLING_CRON expression', { expr: env.BILLING_CRON });
    return;
  }
  cron.schedule(env.BILLING_CRON, async () => {
    try {
      await withLock('lock:billing', 600, () => billingService.runDailyBilling());
    } catch (err) {
      logger.error('Billing job failed', { err: (err as Error).message });
    }
  });
  logger.info('Billing cron scheduled', { expr: env.BILLING_CRON });
}
