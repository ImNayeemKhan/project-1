import { differenceInHours } from 'date-fns';
import { Ticket } from '../models/Ticket';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { sendEmail, templates } from './notification.service';
import { emitWebhook } from './webhook.service';

/**
 * SLA thresholds (hours since lastActivityAt without a new message from a
 * non-customer). Beyond these we bump priority and alert the assignee.
 */
export const SLA_HOURS = {
  low: { warn: 48, escalate: 72 },
  normal: { warn: 24, escalate: 48 },
  high: { warn: 8, escalate: 16 },
  urgent: { warn: 2, escalate: 4 },
} as const;

const BUMP: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
  low: 'normal',
  normal: 'high',
  high: 'urgent',
  urgent: 'urgent',
};

export const ticketSlaService = {
  async runSweep(now = new Date()): Promise<{ scanned: number; escalated: number }> {
    const open = await Ticket.find({ status: { $in: ['open', 'pending'] } }).select(
      'ticketNo subject priority status assignedTo lastActivityAt slaEscalated messages'
    );

    let escalated = 0;
    for (const t of open) {
      const hoursOpen = differenceInHours(now, new Date(t.lastActivityAt));
      const thresh = SLA_HOURS[t.priority as keyof typeof SLA_HOURS] ?? SLA_HOURS.normal;
      if (hoursOpen < thresh.escalate) continue;
      const alreadyEscalated = (t as any).slaEscalated === true;
      if (alreadyEscalated) continue;

      const nextPriority = BUMP[t.priority] ?? 'urgent';
      (t as any).slaEscalated = true;
      t.priority = nextPriority;
      await t.save();

      const assignee = t.assignedTo ? await User.findById(t.assignedTo).select('name email') : null;
      if (assignee?.email) {
        const tmpl = templates.ticketEscalated({
          subject: t.subject,
          ticketNo: t.ticketNo,
          hoursOpen,
        });
        await sendEmail({
          to: assignee.email,
          toName: assignee.name,
          subject: tmpl.subject,
          text: tmpl.text,
          tags: ['ticket-sla', 'escalated'],
        });
      }
      await emitWebhook('ticket.escalated', {
        ticketId: String(t._id),
        ticketNo: t.ticketNo,
        subject: t.subject,
        newPriority: nextPriority,
        hoursOpen,
      }).catch(() => undefined);

      escalated++;
    }

    if (escalated > 0) logger.info('Ticket SLA sweep escalated tickets', { escalated });
    return { scanned: open.length, escalated };
  },
};
