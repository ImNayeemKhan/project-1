import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { Invoice } from '../models/Invoice';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { notifyCustomer, templates } from './notification.service';
import { mikrotikService } from './mikrotik.service';
import { radiusService } from './radius.service';
import { Router as RouterModel } from '../models/Router';
import { emitWebhook } from './webhook.service';

/**
 * Runs after the daily billing cron. For every unpaid invoice, fires the
 * appropriate customer reminder based on days past due:
 *   D+1  → soft reminder
 *   D+3  → firm reminder
 *   D+7  → final notice (service will be suspended in 3 days)
 *   D+10 → auto-suspend via MikroTik/RADIUS
 *
 * Each (invoice, day-bucket) reminder is de-duped in-process via a set of
 * "sent" markers on the invoice document (`remindersSent: ['D1', 'D3', ...]`)
 * so a crash mid-run or a re-run on the same day won't spam the customer.
 */

export const DUNNING_BUCKETS = [1, 3, 7] as const;
export const SUSPEND_AFTER_DAYS = 10;

type Bucket = (typeof DUNNING_BUCKETS)[number];

function bucketKey(days: Bucket): string {
  return `D${days}`;
}

export const dunningService = {
  async runDailyDunning(now = new Date()): Promise<{ reminders: number; suspended: number }> {
    const today = startOfDay(now);
    let reminders = 0;
    let suspended = 0;

    // Candidate invoices: still unpaid/overdue past their dueDate.
    const candidates = await Invoice.find({
      status: { $in: ['unpaid', 'overdue'] },
      dueDate: { $lt: today },
    });

    for (const inv of candidates) {
      const daysOverdue = Math.max(
        0,
        differenceInCalendarDays(today, startOfDay(new Date(inv.dueDate)))
      );

      // --- Reminders ---
      for (const b of DUNNING_BUCKETS) {
        if (daysOverdue >= b && !(inv.remindersSent ?? []).includes(bucketKey(b))) {
          const customer = await User.findById(inv.customer).select('name email phone');
          if (customer) {
            const tmpl = templates.dunningReminder({
              name: customer.name,
              invoiceNo: inv.invoiceNo,
              amount: inv.amount,
              daysOverdue: b,
            });
            await notifyCustomer(
              { name: customer.name, email: customer.email, phone: customer.phone },
              tmpl,
              ['dunning', bucketKey(b)]
            );
            await emitWebhook('invoice.overdue', {
              invoiceId: String(inv._id),
              invoiceNo: inv.invoiceNo,
              customerId: String(inv.customer),
              amount: inv.amount,
              daysOverdue: b,
            }).catch(() => undefined);
          }
          inv.remindersSent = [...(inv.remindersSent ?? []), bucketKey(b)];
          await inv.save();
          reminders++;
        }
      }

      // --- Auto-suspend after SUSPEND_AFTER_DAYS ---
      if (daysOverdue >= SUSPEND_AFTER_DAYS && !(inv.remindersSent ?? []).includes('SUSPENDED')) {
        const sub = await Subscription.findById(inv.subscription);
        if (sub && sub.status === 'active') {
          const router = sub.router ? await RouterModel.findById(sub.router) : null;
          try {
            await mikrotikService.setPppoeEnabled(sub.pppoeUsername, false, router);
            await radiusService
              .sendCoA({ username: sub.pppoeUsername, action: 'disconnect' })
              .catch(() => undefined);
            sub.status = 'suspended';
            sub.suspendedAt = new Date();
            await sub.save();

            const customer = await User.findById(sub.customer).select('name email phone');
            if (customer) {
              const tmpl = templates.serviceSuspended({
                name: customer.name,
                invoiceNo: inv.invoiceNo,
              });
              await notifyCustomer(
                { name: customer.name, email: customer.email, phone: customer.phone },
                tmpl,
                ['dunning', 'suspended']
              );
            }
            await emitWebhook('subscription.suspended', {
              subscriptionId: String(sub._id),
              customerId: String(sub.customer),
              invoiceId: String(inv._id),
              reason: 'overdue',
            }).catch(() => undefined);

            suspended++;
          } catch (err) {
            logger.error('Auto-suspend failed', {
              subId: String(sub._id),
              err: (err as Error).message,
            });
            // Leave the bucket unmarked so the next run retries.
            continue;
          }
        }
        inv.remindersSent = [...(inv.remindersSent ?? []), 'SUSPENDED'];
        if (inv.status === 'unpaid') inv.status = 'overdue';
        await inv.save();
      }
    }

    logger.info('Dunning run complete', { reminders, suspended });
    return { reminders, suspended };
  },
};
