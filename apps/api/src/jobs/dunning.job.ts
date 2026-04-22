import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { dunningService } from '../services/dunning.service';
import { withLock } from '../utils/lock';

export const DUNNING_LOCK_KEY = 'lock:dunning';

export function startDunningJob(): void {
  if (!cron.validate(env.DUNNING_CRON)) {
    logger.error('Invalid DUNNING_CRON expression', { expr: env.DUNNING_CRON });
    return;
  }
  cron.schedule(env.DUNNING_CRON, async () => {
    try {
      await withLock(DUNNING_LOCK_KEY, 600, () => dunningService.runDailyDunning());
    } catch (err) {
      logger.error('Dunning job failed', { err: (err as Error).message });
    }
  });
  logger.info('Dunning cron scheduled', { expr: env.DUNNING_CRON });
}
