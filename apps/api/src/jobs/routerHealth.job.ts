import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { routerHealthService } from '../services/routerHealth.service';
import { withLock } from '../utils/lock';

export const ROUTER_HEALTH_LOCK_KEY = 'lock:router-health';

export function startRouterHealthJob(): void {
  if (!cron.validate(env.ROUTER_HEALTH_CRON)) {
    logger.error('Invalid ROUTER_HEALTH_CRON expression', { expr: env.ROUTER_HEALTH_CRON });
    return;
  }
  cron.schedule(env.ROUTER_HEALTH_CRON, async () => {
    try {
      await withLock(ROUTER_HEALTH_LOCK_KEY, 120, () => routerHealthService.pollAll());
    } catch (err) {
      logger.error('Router health job failed', { err: (err as Error).message });
    }
  });
  logger.info('Router health cron scheduled', { expr: env.ROUTER_HEALTH_CRON });
}
