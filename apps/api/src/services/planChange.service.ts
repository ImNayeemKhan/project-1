import { Types } from 'mongoose';
import { Subscription } from '../models/Subscription';
import { Package as PackagePlan } from '../models/Package';
import { Invoice } from '../models/Invoice';
import { generateInvoiceNo } from '../utils/invoiceNo';
import { logger } from '../config/logger';

/**
 * Proration math for mid-cycle plan changes.
 *
 * We treat the current billing cycle as [periodStart, periodEnd) and the
 * change takes effect `today`. The customer has already paid for the old
 * plan at the old monthly rate. We refund the unused portion of that and
 * charge the new plan's pro-rated amount for the remaining days.
 *
 * Returns the net amount to collect now (positive) or credit (negative).
 */
export function computeProration(opts: {
  oldMonthly: number;
  newMonthly: number;
  periodStart: Date;
  periodEnd: Date;
  today?: Date;
}): { net: number; unusedOldCredit: number; newPlanCharge: number; daysRemaining: number; totalDays: number } {
  const today = opts.today ?? new Date();
  const totalMs = opts.periodEnd.getTime() - opts.periodStart.getTime();
  const remainingMs = Math.max(0, opts.periodEnd.getTime() - today.getTime());
  const totalDays = Math.max(1, Math.round(totalMs / 86_400_000));
  const daysRemaining = Math.max(0, Math.round(remainingMs / 86_400_000));
  const ratio = daysRemaining / totalDays;
  const unusedOldCredit = Math.round(opts.oldMonthly * ratio);
  const newPlanCharge = Math.round(opts.newMonthly * ratio);
  return {
    net: newPlanCharge - unusedOldCredit,
    unusedOldCredit,
    newPlanCharge,
    daysRemaining,
    totalDays,
  };
}

export const planChangeService = {
  /**
   * Request a plan change. If the new plan is cheaper (downgrade) OR the
   * customer chose "queue for next cycle", we queue the change on the
   * subscription's `pendingPackage` field and flip it at next renewal.
   *
   * If the new plan is more expensive AND the customer chose "apply now",
   * we issue a prorated invoice for the difference. Once paid, the router
   * profile is swapped and the new plan takes effect.
   */
  async requestChange(opts: {
    subscriptionId: string | Types.ObjectId;
    newPackageId: string | Types.ObjectId;
    applyNow: boolean;
  }): Promise<{
    mode: 'immediate' | 'queued';
    invoiceId?: string;
    prorationNet?: number;
    effectiveAt?: Date;
  }> {
    const sub = await Subscription.findById(opts.subscriptionId).populate('package');
    if (!sub) throw new Error('Subscription not found');
    if (sub.status === 'cancelled') throw new Error('Subscription is cancelled');

    const oldPkg = sub.package as unknown as { _id: Types.ObjectId; monthlyPrice: number };
    const newPkg = await PackagePlan.findById(opts.newPackageId);
    if (!newPkg) throw new Error('New package not found');
    if (String(newPkg._id) === String(oldPkg._id)) {
      throw new Error('That is already your current plan');
    }

    const isUpgrade = newPkg.monthlyPrice > oldPkg.monthlyPrice;

    if (!opts.applyNow || !isUpgrade) {
      // Downgrade or "apply next cycle": queue it and let billing flip.
      sub.pendingPackage = newPkg._id as Types.ObjectId;
      sub.pendingPackageEffectiveAt = sub.nextBillingDate;
      await sub.save();
      return { mode: 'queued', effectiveAt: sub.nextBillingDate };
    }

    // Upgrade apply-now: compute proration, issue invoice, keep current
    // package in place until payment callback swaps it.
    const periodStart = new Date(sub.nextBillingDate);
    periodStart.setMonth(periodStart.getMonth() - 1);
    const periodEnd = sub.nextBillingDate;

    const p = computeProration({
      oldMonthly: oldPkg.monthlyPrice,
      newMonthly: newPkg.monthlyPrice,
      periodStart,
      periodEnd,
    });

    if (p.net <= 0) {
      // Net credit: no invoice needed, flip now.
      sub.package = newPkg._id as Types.ObjectId;
      await sub.save();
      logger.info('Upgrade with zero/negative net — applied immediately', {
        subId: String(sub._id),
      });
      return { mode: 'immediate', prorationNet: p.net };
    }

    // Use a slightly-shifted period so the compound unique index on
    // (subscription, periodStart) doesn't collide with the existing monthly
    // invoice for the same period.
    const invoice = await Invoice.create({
      invoiceNo: generateInvoiceNo(new Date()),
      customer: sub.customer,
      subscription: sub._id,
      amount: p.net,
      currency: 'BDT',
      periodStart: new Date(Date.now()),
      periodEnd,
      dueDate: new Date(Date.now() + 7 * 86_400_000),
      status: 'unpaid',
    });

    // Queue the package swap; billing.service.markInvoicePaid uses
    // pendingPackage to finalize after payment settles.
    sub.pendingPackage = newPkg._id as Types.ObjectId;
    sub.pendingPackageEffectiveAt = new Date();
    await sub.save();

    return {
      mode: 'immediate',
      invoiceId: String(invoice._id),
      prorationNet: p.net,
    };
  },
};
