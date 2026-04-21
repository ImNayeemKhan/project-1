import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Subscription } from '../models/Subscription';
import { Package as PackagePlan } from '../models/Package';
import { Invoice } from '../models/Invoice';
import { NotFound, BadRequest } from '../utils/errors';
import { planChangeService } from '../services/planChange.service';
import { mikrotikService } from '../services/mikrotik.service';
import { radiusService } from '../services/radius.service';
import { Router as RouterModel } from '../models/Router';
import { emitWebhook } from '../services/webhook.service';

export const customerSubscriptionRouter = Router();
customerSubscriptionRouter.use(requireAuth, requireRole('customer'));

const MAX_PAUSE_DAYS_PER_YEAR = 30;

function ownSubscription(id: string, customerId: string) {
  return Subscription.findOne({ _id: id, customer: customerId });
}

// Upgrade / downgrade with proration.
const changeSchema = z.object({
  packageId: z.string().min(6),
  applyNow: z.boolean().default(true),
});

customerSubscriptionRouter.post(
  '/:id/change-plan',
  validate(changeSchema),
  asyncHandler(async (req, res) => {
    const sub = await ownSubscription(req.params.id, req.auth!.userId);
    if (!sub) throw NotFound('Subscription not found');

    const result = await planChangeService.requestChange({
      subscriptionId: sub._id,
      newPackageId: req.body.packageId,
      applyNow: req.body.applyNow,
    });

    res.json({ ok: true, ...result });
  })
);

// Quote (preview) — no side effects, just shows proration math.
customerSubscriptionRouter.get(
  '/:id/change-plan/quote',
  asyncHandler(async (req, res) => {
    const sub = await ownSubscription(req.params.id, req.auth!.userId).then((s) =>
      s ? Subscription.findById(s._id).populate('package') : null
    );
    if (!sub) throw NotFound('Subscription not found');
    const newPackageId = String(req.query.packageId ?? '');
    const newPkg = await PackagePlan.findById(newPackageId);
    if (!newPkg) throw NotFound('Target package not found');

    const oldPkg = sub.package as unknown as { monthlyPrice: number };
    const periodEnd = sub.nextBillingDate;
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - 1);

    const { computeProration } = await import('../services/planChange.service');
    const p = computeProration({
      oldMonthly: oldPkg.monthlyPrice,
      newMonthly: newPkg.monthlyPrice,
      periodStart,
      periodEnd,
    });
    res.json({ proration: p, newMonthly: newPkg.monthlyPrice });
  })
);

// Pause / vacation hold.
const pauseSchema = z.object({
  days: z.number().int().min(3).max(30),
});

customerSubscriptionRouter.post(
  '/:id/pause',
  validate(pauseSchema),
  asyncHandler(async (req, res) => {
    const sub = await ownSubscription(req.params.id, req.auth!.userId);
    if (!sub) throw NotFound('Subscription not found');
    if (sub.status !== 'active') throw BadRequest('Only active subscriptions can be paused');
    if (sub.pausedAt) throw BadRequest('Subscription is already paused');

    // Rolling year budget. Resets if we crossed into a new pauseYear window.
    const now = new Date();
    const yearStart = sub.pauseYearStartedAt ?? now;
    const oneYear = 365 * 86_400_000;
    const usedThisYear =
      now.getTime() - yearStart.getTime() > oneYear ? 0 : sub.pauseDaysUsedThisYear ?? 0;
    if (usedThisYear + req.body.days > MAX_PAUSE_DAYS_PER_YEAR) {
      throw BadRequest(
        `You have ${MAX_PAUSE_DAYS_PER_YEAR - usedThisYear} pause days left this year.`
      );
    }

    const router = sub.router ? await RouterModel.findById(sub.router) : null;
    try {
      await mikrotikService.setPppoeEnabled(sub.pppoeUsername, false, router);
      await radiusService
        .sendCoA({ username: sub.pppoeUsername, action: 'disconnect' })
        .catch(() => undefined);
    } catch {
      // Continue anyway — line might already be down; admin can retry.
    }

    sub.pausedAt = now;
    sub.pauseEndsAt = new Date(now.getTime() + req.body.days * 86_400_000);
    sub.pauseYearStartedAt = yearStart;
    sub.pauseDaysUsedThisYear = usedThisYear + req.body.days;
    sub.status = 'suspended';
    await sub.save();

    await emitWebhook('subscription.suspended', {
      subscriptionId: String(sub._id),
      customerId: String(sub.customer),
      reason: 'customer-paused',
      resumeAt: sub.pauseEndsAt,
    }).catch(() => undefined);

    res.json({ ok: true, pauseEndsAt: sub.pauseEndsAt });
  })
);

customerSubscriptionRouter.post(
  '/:id/resume',
  asyncHandler(async (req, res) => {
    const sub = await ownSubscription(req.params.id, req.auth!.userId);
    if (!sub) throw NotFound('Subscription not found');
    if (!sub.pausedAt) throw BadRequest('Subscription is not paused');

    const router = sub.router ? await RouterModel.findById(sub.router) : null;
    try {
      await mikrotikService.setPppoeEnabled(sub.pppoeUsername, true, router);
      await radiusService
        .sendCoA({ username: sub.pppoeUsername, action: 'reauthorize' })
        .catch(() => undefined);
    } catch {
      // Router may be unreachable; admin NOC will finish provisioning.
    }
    sub.pausedAt = undefined;
    sub.pauseEndsAt = undefined;
    sub.status = 'active';
    sub.suspendedAt = undefined;
    await sub.save();

    await emitWebhook('subscription.reactivated', {
      subscriptionId: String(sub._id),
      customerId: String(sub.customer),
      reason: 'customer-resumed',
    }).catch(() => undefined);

    res.json({ ok: true });
  })
);

// Autopay toggle.
customerSubscriptionRouter.post(
  '/:id/autopay',
  validate(z.object({ enabled: z.boolean() })),
  asyncHandler(async (req, res) => {
    const sub = await ownSubscription(req.params.id, req.auth!.userId);
    if (!sub) throw NotFound('Subscription not found');
    sub.autoPay = req.body.enabled;
    await sub.save();
    res.json({ ok: true, autoPay: sub.autoPay });
  })
);

// Referral: get (or mint) the subscription's referral code. First call
// generates a 6-char code; subsequent calls return the same one.
customerSubscriptionRouter.get(
  '/:id/referral',
  asyncHandler(async (req, res) => {
    const sub = await ownSubscription(req.params.id, req.auth!.userId);
    if (!sub) throw NotFound('Subscription not found');
    if (!sub.referralCode) {
      sub.referralCode = crypto
        .randomBytes(4)
        .toString('base64')
        .replace(/[+/=]/g, '')
        .slice(0, 6)
        .toUpperCase();
      await sub.save();
    }
    const invited = await Subscription.countDocuments({ referredBy: sub.customer });
    res.json({ code: sub.referralCode, invitedCount: invited });
  })
);

// Usage graph: returns daily up/down bytes for last 30 days. If no
// UsageLog rows exist, returns an empty series — frontend renders the
// "not enough data yet" state.
customerSubscriptionRouter.get(
  '/:id/usage',
  asyncHandler(async (req, res) => {
    const sub = await ownSubscription(req.params.id, req.auth!.userId);
    if (!sub) throw NotFound('Subscription not found');

    const { UsageLog } = await import('../models/UsageLog');
    const since = new Date(Date.now() - 30 * 86_400_000);
    const rows = await UsageLog.find({
      subscription: sub._id,
      day: { $gte: since },
    })
      .sort({ day: 1 })
      .lean();
    const fup = await PackagePlan.findById(sub.package).select('fupGB').lean();
    const totalUsedMB = rows.reduce((s, r) => s + (r.downloadMB ?? 0) + (r.uploadMB ?? 0), 0);
    res.json({
      series: rows.map((r) => ({
        date: r.day,
        downloadMB: r.downloadMB ?? 0,
        uploadMB: r.uploadMB ?? 0,
      })),
      fupGB: fup?.fupGB ?? null,
      totalUsedGB: +(totalUsedMB / 1024).toFixed(2),
    });
  })
);

// Invoice PDF: minimal printable HTML (browser → "Save as PDF" is fine for
// production ISPs; avoids shipping a full PDF dependency).
customerSubscriptionRouter.get(
  '/:id/invoices/:invoiceId/print',
  asyncHandler(async (req, res) => {
    const sub = await ownSubscription(req.params.id, req.auth!.userId);
    if (!sub) throw NotFound('Subscription not found');
    const invoice = await Invoice.findOne({
      _id: req.params.invoiceId,
      subscription: sub._id,
    }).populate('customer', 'name email phone address');
    if (!invoice) throw NotFound('Invoice not found');

    const customer = invoice.customer as unknown as {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
    };
    const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>Invoice ${invoice.invoiceNo}</title>
<style>
body { font: 14px/1.4 system-ui, sans-serif; color:#111; max-width:780px; margin:40px auto; padding:0 24px; }
h1 { margin:0; font-size:28px; letter-spacing:-0.02em; }
.header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; border-bottom:2px solid #111; }
.meta { font-size:12px; color:#555; }
table { width:100%; border-collapse:collapse; margin-top:24px; }
th, td { padding:10px 8px; text-align:left; border-bottom:1px solid #eee; }
th { background:#fafafa; font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:#555; }
.total { text-align:right; font-size:18px; font-weight:700; margin-top:16px; }
.status { display:inline-block; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; text-transform:uppercase; }
.status.paid { background:#dcfce7; color:#166534; }
.status.unpaid { background:#fef3c7; color:#92400e; }
.status.overdue { background:#fee2e2; color:#991b1b; }
@media print { body { margin:0; } .no-print { display:none; } }
</style></head>
<body>
<div class="header">
  <div>
    <h1>Desh Communications</h1>
    <div class="meta">Mohammadpur, Dhaka · info@deshcommunications.net · 09643 111 444</div>
  </div>
  <div style="text-align:right;">
    <div style="font-size:12px; color:#555;">Invoice</div>
    <div style="font-size:20px; font-weight:700;">${invoice.invoiceNo}</div>
    <div class="status ${invoice.status}">${invoice.status}</div>
  </div>
</div>
<table>
  <tr><th>Billed to</th><th>Period</th><th>Due</th></tr>
  <tr>
    <td>${customer.name}<br/><span class="meta">${customer.email ?? ''} · ${customer.phone ?? ''}</span></td>
    <td>${invoice.periodStart.toDateString()} – ${invoice.periodEnd.toDateString()}</td>
    <td>${invoice.dueDate.toDateString()}</td>
  </tr>
</table>
<table>
  <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
  <tr><td>Monthly internet subscription (PPPoE ${sub.pppoeUsername})</td><td style="text-align:right">৳${invoice.amount}</td></tr>
</table>
<div class="total">Total: ৳${invoice.amount} ${invoice.currency}</div>
${invoice.paidAt ? `<div class="meta" style="margin-top:12px;">Paid ${new Date(invoice.paidAt).toDateString()} · Ref ${invoice.paymentRef ?? ''}</div>` : ''}
<p class="meta" style="margin-top:40px; text-align:center;">Thank you for choosing Desh Communications.</p>
<div class="no-print" style="text-align:center; margin-top:24px;">
  <button onclick="window.print()" style="padding:10px 20px; font-size:14px; border-radius:6px; border:1px solid #111; background:#111; color:#fff; cursor:pointer;">Print / Save as PDF</button>
</div>
</body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  })
);
