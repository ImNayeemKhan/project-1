import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { billingService } from '../services/billing.service';
import { withLock } from '../utils/lock';

export const BILLING_LOCK_KEY = 'lock:billing';

export function startBillingJob(): void {
  if (!cron.validate(env.BILLING_CRON)) {
    logger.error('Invalid BILLING_CRON expression', { expr: env.BILLING_CRON });
    return;
  }
  cron.schedule(env.BILLING_CRON, async () => {
    try {
      await withLock(BILLING_LOCK_KEY, 600, () => billingService.runDailyBilling());
    } catch (err) {
      logger.error('Billing job failed', { err: (err as Error).message });
    }
  });
  logger.info('Billing cron scheduled', { expr: env.BILLING_CRON });
}
