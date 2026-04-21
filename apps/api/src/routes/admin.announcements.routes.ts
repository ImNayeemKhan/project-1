import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Announcement } from '../models/Announcement';
import { NotFound } from '../utils/errors';

export const adminAnnouncementsRouter = Router();
adminAnnouncementsRouter.use(requireAuth, requireRole('admin'));

adminAnnouncementsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Announcement.find().sort({ isPinned: -1, publishedAt: -1 }).limit(200);
    res.json({ items });
  })
);

const upsertSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  audience: z.enum(['all', 'active', 'suspended', 'admins']).optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  publishedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isPinned: z.boolean().optional(),
});

adminAnnouncementsRouter.post(
  '/',
  validate(upsertSchema),
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.create({ ...req.body, createdBy: req.auth!.userId });
    res.status(201).json({ announcement });
  })
);

adminAnnouncementsRouter.patch(
  '/:id',
  validate(upsertSchema.partial()),
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) throw NotFound('Announcement not found');
    res.json({ announcement });
  })
);

adminAnnouncementsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) throw NotFound('Announcement not found');
    res.json({ ok: true });
  })
);
