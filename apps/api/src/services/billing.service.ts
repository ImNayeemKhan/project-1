import { addMonths, addDays, startOfDay } from 'date-fns';
import { Subscription } from '../models/Subscription';
import { Package as PackagePlan } from '../models/Package';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';
import { generateInvoiceNo } from '../utils/invoiceNo';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { mikrotikService } from './mikrotik.service';
import { radiusService } from './radius.service';
import { Router as RouterModel } from '../models/Router';
import { notifyCustomer, templates } from './notification.service';
import { emitWebhook } from './webhook.service';
import { decrypt } from '../utils/crypto';

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
      try {
        // Apply a queued plan change scheduled to take effect at this
        // renewal. Downgrades (or "apply next cycle") are queued on the
        // subscription's pendingPackage; flipping now means the new period's
        // invoice is billed at the new rate.
        if (
          sub.pendingPackage &&
          sub.pendingPackageEffectiveAt &&
          sub.pendingPackageEffectiveAt.getTime() <= today.getTime()
        ) {
          sub.package = sub.pendingPackage;
          sub.pendingPackage = undefined;
          sub.pendingPackageEffectiveAt = undefined;
          await sub.populate('package');
        }
        const pkg = sub.package as unknown as { monthlyPrice: number };
        const periodStart = sub.nextBillingDate;
        const periodEnd = addMonths(periodStart, 1);
        // Grace period must be measured from the later of today and periodStart.
        // If the cron catches up after server downtime (periodStart < today),
        // anchoring on periodStart would produce a dueDate already in the past,
        // causing the freshly-created invoice to be suspended in the same run.
        const graceAnchor = today > periodStart ? today : periodStart;
        const dueDate = addDays(graceAnchor, env.BILLING_GRACE_DAYS);

        // Idempotency guard: if we previously created this invoice but the
        // subscription save failed afterwards (or a concurrent run raced us),
        // reuse it instead of duplicating. Void invoices are explicitly
        // excluded — an admin voiding last month's invoice should not cause
        // the customer to skip billing for that period entirely; the next
        // billing run should mint a replacement. The partial unique index on
        // Invoice (subscription, periodStart) WHERE status != 'void'
        // enforces this at the database layer as well.
        const existing = await Invoice.findOne({
          subscription: sub._id,
          periodStart,
          status: { $ne: 'void' },
        });
        if (!existing) {
          const invoice = await Invoice.create({
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
          invoicesCreated++;
          // Fire-and-forget: notify the customer their invoice is ready and
          // let downstream systems (accounting, CRMs) hear about it via the
          // webhook fan-out. Never let a notification failure abort billing.
          const customer = await User.findById(sub.customer).select('name email phone');
          if (customer) {
            const tmpl = templates.invoiceIssued({
              name: customer.name,
              invoiceNo: invoice.invoiceNo,
              amount: invoice.amount,
              dueDate,
            });
            await notifyCustomer(
              { name: customer.name, email: customer.email, phone: customer.phone },
              tmpl,
              ['invoice', 'issued']
            );
          }
          await emitWebhook('invoice.created', {
            invoiceId: String(invoice._id),
            invoiceNo: invoice.invoiceNo,
            customerId: String(sub.customer),
            subscriptionId: String(sub._id),
            amount: invoice.amount,
            dueDate,
          }).catch(() => undefined);
        }

        sub.nextBillingDate = periodEnd;
        await sub.save();
      } catch (err) {
        // Per-subscription failure must not abort the whole billing run;
        // log and move on to the next subscription.
        logger.error('Failed to invoice subscription', {
          subId: String(sub._id),
          err: (err as Error).message,
        });
      }
    }

    // Suspend subscriptions with unpaid invoices past the grace period.
    // The `createdAt < today` filter prevents invoices minted earlier in
    // this same run (server catch-up, or BILLING_GRACE_DAYS=0) from being
    // immediately suspended with zero notice to the customer — the grace
    // clock should run for at least one calendar day.
    const overdueInvoices = await Invoice.find({
      status: 'unpaid',
      dueDate: { $lt: today },
      createdAt: { $lt: today },
    }).select('subscription');

    const overdueSubIds = Array.from(
      new Set(overdueInvoices.map((i) => String(i.subscription)))
    );

    for (const subId of overdueSubIds) {
      const sub = await Subscription.findById(subId).populate('router');
      if (!sub || sub.status !== 'active') continue;

      // Only flip the subscription to `suspended` after the PPPoE disable has
      // actually succeeded. Otherwise (router unreachable, timeout, MikroTik
      // auth error, …) we'd end up with a DB record marked suspended while
      // the customer keeps browsing — effectively free service.
      try {
        await mikrotikService.setPppoeEnabled(sub.pppoeUsername, false, (sub.router as any) ?? null);
        await radiusService.sendCoA({ username: sub.pppoeUsername, action: 'disconnect' }).catch(() => undefined);

        sub.status = 'suspended';
        sub.suspendedAt = new Date();
        await sub.save();

        await Invoice.updateMany(
          { subscription: sub._id, status: 'unpaid', dueDate: { $lt: today } },
          { $set: { status: 'overdue' } }
        );
        suspended++;
      } catch (err) {
        logger.error('Failed to disable PPPoE for overdue sub — NOT marking suspended', {
          subId,
          err: (err as Error).message,
        });
        // Leave status=active so the next billing run retries the disable.
      }
    }

    logger.info('Billing run complete', { invoicesCreated, suspended });
    return { invoicesCreated, suspended };
  },

  /**
   * Called by payment callbacks: marks the invoice paid, re-enables the PPPoE user
   * if the subscription was suspended, and sends a RADIUS CoA-reauthorize.
   */
  async markInvoicePaid(invoiceId: string, paymentRef: string): Promise<void> {
    // Atomic status transition. Two concurrent payment callbacks for the
    // same invoice (e.g. a double-submitted bKash session that somehow
    // bypassed the /bkash/init in-flight guard) must NOT both proceed past
    // this check: the downstream side-effects (plan-change finalize,
    // provisioning calls to MikroTik, webhook fan-out) are not idempotent
    // on the router side and would re-provision or double-notify.
    //
    // `findOneAndUpdate` with a status precondition serializes the
    // transition at the database layer — exactly one caller wins and sees
    // the updated document; every other concurrent caller sees `null` and
    // returns without doing anything.
    const invoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, status: { $nin: ['paid', 'void'] } },
      {
        $set: {
          status: 'paid',
          paidAt: new Date(),
          paymentRef,
          // Reset dunning so a re-billed future period starts from a clean slate.
          remindersSent: [],
        },
      },
      { new: true }
    );
    if (!invoice) {
      // Either the invoice doesn't exist or it's already in a terminal
      // state (paid / void). Callers treat both as a no-op; distinguish
      // only if needed for logging.
      const exists = await Invoice.exists({ _id: invoiceId });
      if (!exists) throw new Error('Invoice not found');
      return;
    }

    // Finalize a queued plan change. If this invoice covers a pro-rated
    // upgrade (planChangeService set pendingPackage + pendingPackageEffectiveAt
    // at request time), swap the package on the subscription and clear the
    // pending fields now that money has settled.
    const subForChange = await Subscription.findById(invoice.subscription);
    if (
      subForChange?.pendingPackage &&
      subForChange.pendingPackageEffectiveAt &&
      subForChange.pendingPackageEffectiveAt.getTime() <= Date.now()
    ) {
      subForChange.package = subForChange.pendingPackage;
      subForChange.pendingPackage = undefined;
      subForChange.pendingPackageEffectiveAt = undefined;
      await subForChange.save();
      logger.info('Applied queued plan change after payment', {
        subId: String(subForChange._id),
      });
    }

    // Receipt + invoice.paid webhook (independent of provisioning outcome).
    const customer = await User.findById(invoice.customer).select('name email phone');
    if (customer) {
      const tmpl = templates.paymentReceipt({
        name: customer.name,
        invoiceNo: invoice.invoiceNo,
        amount: invoice.amount,
        trxId: paymentRef,
      });
      await notifyCustomer(
        { name: customer.name, email: customer.email, phone: customer.phone },
        tmpl,
        ['payment', 'receipt']
      );
    }
    await emitWebhook('invoice.paid', {
      invoiceId: String(invoice._id),
      invoiceNo: invoice.invoiceNo,
      customerId: String(invoice.customer),
      amount: invoice.amount,
      paymentRef,
    }).catch(() => undefined);
    await emitWebhook('payment.succeeded', {
      invoiceId: String(invoice._id),
      invoiceNo: invoice.invoiceNo,
      customerId: String(invoice.customer),
      amount: invoice.amount,
      paymentRef,
    }).catch(() => undefined);

    const sub = await Subscription.findById(invoice.subscription);
    if (!sub) return;

    const router = sub.router ? await RouterModel.findById(sub.router) : null;

    // Auto-provision on first payment: if the subscription is still 'pending'
    // (admin created it from a lead but hasn't provisioned yet), bring it up
    // on the router and flip to active now that money has actually moved.
    if (sub.status === 'pending') {
      try {
        const pkg = await PackagePlan.findById(sub.package);
        // Decrypt the PPPoE password that was stored at subscription-creation
        // time. Using the username as a placeholder here would provision the
        // router with the wrong secret and the customer's dialer would fail
        // with "authentication error" on a real MikroTik.
        const pppoePassword = decrypt(sub.pppoePasswordEncrypted);
        await mikrotikService.addPppoeUser(
          {
            username: sub.pppoeUsername,
            password: pppoePassword,
            profile: pkg?.mikrotikProfile || pkg?.code || 'default',
            comment: `cust:${sub.customer}`,
          },
          router
        );
        sub.status = 'active';
        sub.activatedAt = new Date();
        await sub.save();
        await emitWebhook('subscription.created', {
          subscriptionId: String(sub._id),
          customerId: String(sub.customer),
          packageId: String(sub.package),
          via: 'first-payment',
        }).catch(() => undefined);
      } catch (err) {
        logger.error('Auto-provision on first payment failed; leaving pending', {
          subId: String(sub._id),
          err: (err as Error).message,
        });
      }
    } else if (sub.status === 'suspended') {
      // Only flip the subscription back to 'active' if we actually succeeded
      // in re-enabling the PPPoE user on the router. Otherwise the customer
      // would appear active in the database while their line is still disabled
      // on the router — paying for service they can't use. Leave it suspended,
      // log, and let the next payment callback / admin action retry the
      // provisioning.
      try {
        await mikrotikService.setPppoeEnabled(sub.pppoeUsername, true, router);
        await radiusService.sendCoA({ username: sub.pppoeUsername, action: 'reauthorize' }).catch(() => undefined);
        sub.status = 'active';
        sub.suspendedAt = undefined;
        await sub.save();
        if (customer) {
          const tmpl = templates.serviceReactivated({ name: customer.name });
          await notifyCustomer(
            { name: customer.name, email: customer.email, phone: customer.phone },
            tmpl,
            ['subscription', 'reactivated']
          );
        }
        await emitWebhook('subscription.reactivated', {
          subscriptionId: String(sub._id),
          customerId: String(sub.customer),
          trigger: 'payment',
        }).catch(() => undefined);
      } catch (err) {
        logger.error('Failed to re-enable PPPoE on payment; leaving subscription suspended for retry', {
          subId: String(sub._id),
          err: (err as Error).message,
        });
      }
    }
  },

  async previewNextInvoiceAmount(subscriptionId: string): Promise<number> {
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) throw new Error('Subscription not found');
    const pkg = await PackagePlan.findById(sub.package);
    return pkg?.monthlyPrice ?? 0;
  },
};
