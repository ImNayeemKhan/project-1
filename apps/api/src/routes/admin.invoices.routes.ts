import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Invoice } from '../models/Invoice';
import { billingService } from '../services/billing.service';
import { NotFound } from '../utils/errors';

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
    const result = await billingService.runDailyBilling();
    res.json(result);
  })
);
