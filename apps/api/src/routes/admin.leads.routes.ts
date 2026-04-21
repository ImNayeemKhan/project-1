import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Lead } from '../models/Lead';
import { NotFound } from '../utils/errors';

export const adminLeadsRouter = Router();
adminLeadsRouter.use(requireAuth, requireRole('admin', 'reseller'));

adminLeadsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, assignedTo } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    const items = await Lead.find(filter)
      .populate('zone', 'name code')
      .populate('packageInterest', 'name code monthlyPrice')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ items });
  })
);

const upsertSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  zone: z.string().optional(),
  packageInterest: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  source: z.enum(['website', 'referral', 'walkin', 'phone', 'other']).optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

adminLeadsRouter.post(
  '/',
  validate(upsertSchema),
  asyncHandler(async (req, res) => {
    const lead = await Lead.create(req.body);
    res.status(201).json({ lead });
  })
);

adminLeadsRouter.patch(
  '/:id',
  validate(upsertSchema.partial()),
  asyncHandler(async (req, res) => {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) throw NotFound('Lead not found');
    res.json({ lead });
  })
);

adminLeadsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) throw NotFound('Lead not found');
    res.json({ ok: true });
  })
);
