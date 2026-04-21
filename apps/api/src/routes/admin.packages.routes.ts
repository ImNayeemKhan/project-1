import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Package } from '../models/Package';
import { Conflict, NotFound } from '../utils/errors';

export const adminPackagesRouter = Router();
adminPackagesRouter.use(requireAuth, requireRole('admin'));

adminPackagesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Package.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json({ items });
  })
);

const upsertSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  downloadMbps: z.number().min(0),
  uploadMbps: z.number().min(0),
  monthlyPrice: z.number().min(0),
  setupFee: z.number().min(0).optional(),
  fupGB: z.number().min(0).optional(),
  features: z.array(z.string()).optional(),
  mikrotikProfile: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

adminPackagesRouter.post(
  '/',
  validate(upsertSchema),
  asyncHandler(async (req, res) => {
    const existing = await Package.findOne({ code: req.body.code.toUpperCase() });
    if (existing) throw Conflict('Package code already exists');
    const pkg = await Package.create({ ...req.body, code: req.body.code.toUpperCase() });
    res.status(201).json({ package: pkg });
  })
);

adminPackagesRouter.patch(
  '/:id',
  validate(upsertSchema.partial()),
  asyncHandler(async (req, res) => {
    const update = { ...req.body };
    if (update.code) update.code = update.code.toUpperCase();
    const pkg = await Package.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!pkg) throw NotFound('Package not found');
    res.json({ package: pkg });
  })
);

adminPackagesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const pkg = await Package.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!pkg) throw NotFound('Package not found');
    res.json({ ok: true });
  })
);
