import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ticketSlaService } from '../services/ticketSla.service';
import { withLock } from '../utils/lock';

export const TICKET_SLA_LOCK_KEY = 'lock:ticket-sla';

export function startTicketSlaJob(): void {
  if (!cron.validate(env.TICKET_SLA_CRON)) {
    logger.error('Invalid TICKET_SLA_CRON expression', { expr: env.TICKET_SLA_CRON });
    return;
  }
  cron.schedule(env.TICKET_SLA_CRON, async () => {
    try {
      await withLock(TICKET_SLA_LOCK_KEY, 120, () => ticketSlaService.runSweep());
    } catch (err) {
      logger.error('Ticket SLA job failed', { err: (err as Error).message });
    }
  });
  logger.info('Ticket SLA cron scheduled', { expr: env.TICKET_SLA_CRON });
}
