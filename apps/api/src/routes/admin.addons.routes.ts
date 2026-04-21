import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { ServiceAddon } from '../models/ServiceAddon';
import { Conflict, NotFound } from '../utils/errors';

export const adminAddonsRouter = Router();
adminAddonsRouter.use(requireAuth, requireRole('admin'));

adminAddonsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await ServiceAddon.find().sort({ sortOrder: 1, name: 1 });
    res.json({ items });
  })
);

const upsertSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.enum(['ip', 'iptv', 'backup', 'wifi', 'security', 'other']).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  monthlyPrice: z.number().min(0),
  setupFee: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

adminAddonsRouter.post(
  '/',
  validate(upsertSchema),
  asyncHandler(async (req, res) => {
    const code = req.body.code.toUpperCase();
    const exists = await ServiceAddon.findOne({ code });
    if (exists) throw Conflict('Add-on code already exists');
    const addon = await ServiceAddon.create({ ...req.body, code });
    res.status(201).json({ addon });
  })
);

adminAddonsRouter.patch(
  '/:id',
  validate(upsertSchema.partial()),
  asyncHandler(async (req, res) => {
    const update = { ...req.body };
    if (update.code) update.code = update.code.toUpperCase();
    const addon = await ServiceAddon.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!addon) throw NotFound('Add-on not found');
    res.json({ addon });
  })
);

adminAddonsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const addon = await ServiceAddon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!addon) throw NotFound('Add-on not found');
    res.json({ ok: true });
  })
);
