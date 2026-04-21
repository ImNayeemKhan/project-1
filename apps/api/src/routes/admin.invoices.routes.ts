import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Invoice } from '../models/Invoice';
import { billingService } from '../services/billing.service';
import { BILLING_LOCK_KEY } from '../jobs/billing.job';
import { withLock } from '../utils/lock';
import { Conflict, NotFound } from '../utils/errors';

export const adminInvoicesRouter = Router();
adminInvoicesRouter.use(requireAuth, requireRole('admin', 'reseller'));

adminInvoicesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, customer } = req.query as Record<string, string | undefined>;
    const filter: any = {};
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    const items = await Invoice.find(filter)
      .populate('customer', 'name email')
      .populate('subscription', 'pppoeUsername')
      .sort({ createdAt: -1 })
      .limit(500);
    res.json({ items });
  })
);

adminInvoicesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const inv = await Invoice.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('subscription', 'pppoeUsername');
    if (!inv) throw NotFound('Invoice not found');
    res.json({ invoice: inv });
  })
);

adminInvoicesRouter.post(
  '/:id/mark-paid',
  validate(z.object({ reference: z.string().default('manual') })),
  asyncHandler(async (req, res) => {
    await billingService.markInvoicePaid(req.params.id, req.body.reference);
    res.json({ ok: true });
  })
);

adminInvoicesRouter.post(
  '/run-billing',
  asyncHandler(async (_req, res) => {
    // Reuse the same distributed lock as the cron job so that a manual admin
    // trigger cannot race the cron and produce duplicate invoices.
    const result = await withLock(BILLING_LOCK_KEY, 600, () =>
      billingService.runDailyBilling()
    );
    if (result === null) throw Conflict('Billing run already in progress');
    res.json(result);
  })
);
