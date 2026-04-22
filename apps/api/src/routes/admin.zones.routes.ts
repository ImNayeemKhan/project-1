import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Zone } from '../models/Zone';
import { Conflict, NotFound } from '../utils/errors';

export const adminZonesRouter = Router();
adminZonesRouter.use(requireAuth, requireRole('admin'));

adminZonesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Zone.find().sort({ name: 1 });
    res.json({ items });
  })
);

const upsertSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  city: z.string().optional(),
  description: z.string().optional(),
  coverageNote: z.string().optional(),
  isActive: z.boolean().optional(),
});

adminZonesRouter.post(
  '/',
  validate(upsertSchema),
  asyncHandler(async (req, res) => {
    const code = req.body.code.toUpperCase();
    const existing = await Zone.findOne({ code });
    if (existing) throw Conflict('Zone code already exists');
    const zone = await Zone.create({ ...req.body, code });
    res.status(201).json({ zone });
  })
);

adminZonesRouter.patch(
  '/:id',
  validate(upsertSchema.partial()),
  asyncHandler(async (req, res) => {
    const update = { ...req.body };
    if (update.code) update.code = update.code.toUpperCase();
    const zone = await Zone.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!zone) throw NotFound('Zone not found');
    res.json({ zone });
  })
);

adminZonesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const zone = await Zone.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!zone) throw NotFound('Zone not found');
    res.json({ ok: true });
  })
);
