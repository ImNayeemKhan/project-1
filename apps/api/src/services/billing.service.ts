import { addMonths, addDays, startOfDay } from 'date-fns';
import { Subscription } from '../models/Subscription';
import { Package as PackagePlan } from '../models/Package';
import { Invoice } from '../models/Invoice';
import { generateInvoiceNo } from '../utils/invoiceNo';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { mikrotikService } from './mikrotik.service';
import { radiusService } from './radius.service';
import { Router as RouterModel } from '../models/Router';

export const billingService = {
  /**
   * Generates invoices for any active subscription whose nextBillingDate is today or earlier
   * and doesn't already have an unpaid invoice for the current cycle.
   */
  async runDailyBilling(now = new Date()): Promise<{ invoicesCreated: number; suspended: number }> {
    const today = startOfDay(now);
    let invoicesCreated = 0;
    let suspended = 0;

    const due = await Subscription.find({
      status: 'active',
      nextBillingDate: { $lte: today },
    }).populate('package');

    for (const sub of due) {
      const pkg = sub.package as unknown as { monthlyPrice: number };
      const periodStart = sub.nextBillingDate;
      const periodEnd = addMonths(periodStart, 1);
      const dueDate = addDays(periodStart, env.BILLING_GRACE_DAYS);

      await Invoice.create({
        invoiceNo: generateInvoiceNo(periodStart),
        customer: sub.customer,
        subscription: sub._id,
        amount: pkg.monthlyPrice,
        currency: 'BDT',
        periodStart,
        periodEnd,
        dueDate,
        status: 'unpaid',
      });

      sub.nextBillingDate = periodEnd;
      await sub.save();
      invoicesCreated++;
    }

    // Suspend subscriptions with unpaid invoices past the grace period.
    const overdueInvoices = await Invoice.find({
      status: 'unpaid',
      dueDate: { $lt: today },
    }).select('subscription');

    const overdueSubIds = Array.from(
      new Set(overdueInvoices.map((i) => String(i.subscription)))
    );

    for (const subId of overdueSubIds) {
      const sub = await Subscription.findById(subId).populate('router');
      if (!sub || sub.status !== 'active') continue;

      try {
        await mikrotikService.setPppoeEnabled(sub.pppoeUsername, false, (sub.router as any) ?? null);
        await radiusService.sendCoA({ username: sub.pppoeUsername, action: 'disconnect' }).catch(() => undefined);
      } catch (err) {
        logger.error('Failed to disable PPPoE for overdue sub', { subId, err: (err as Error).message });
      }

      sub.status = 'suspended';
      sub.suspendedAt = new Date();
      await sub.save();

      // Mark overdue invoices
      await Invoice.updateMany(
        { subscription: sub._id, status: 'unpaid', dueDate: { $lt: today } },
        { $set: { status: 'overdue' } }
      );
      suspended++;
    }

    logger.info('Billing run complete', { invoicesCreated, suspended });
    return { invoicesCreated, suspended };
  },

  /**
   * Called by payment callbacks: marks the invoice paid, re-enables the PPPoE user
   * if the subscription was suspended, and sends a RADIUS CoA-reauthorize.
   */
  async markInvoicePaid(invoiceId: string, paymentRef: string): Promise<void> {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'paid') return;

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.paymentRef = paymentRef;
    await invoice.save();

    const sub = await Subscription.findById(invoice.subscription);
    if (!sub) return;

    const router = sub.router ? await RouterModel.findById(sub.router) : null;

    if (sub.status === 'suspended') {
      try {
        await mikrotikService.setPppoeEnabled(sub.pppoeUsername, true, router);
        await radiusService.sendCoA({ username: sub.pppoeUsername, action: 'reauthorize' }).catch(() => undefined);
      } catch (err) {
        logger.error('Failed to re-enable PPPoE on payment', { subId: String(sub._id), err: (err as Error).message });
      }
      sub.status = 'active';
      sub.suspendedAt = undefined;
      await sub.save();
    }
  },

  async previewNextInvoiceAmount(subscriptionId: string): Promise<number> {
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) throw new Error('Subscription not found');
    const pkg = await PackagePlan.findById(sub.package);
    return pkg?.monthlyPrice ?? 0;
  },
};
