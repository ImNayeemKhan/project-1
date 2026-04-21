import { Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Router as RouterModel } from '../models/Router';
import { encrypt } from '../utils/crypto';
import { mikrotikService } from '../services/mikrotik.service';
import { NotFound } from '../utils/errors';

export const adminRoutersRouter = ExpressRouter();
adminRoutersRouter.use(requireAuth, requireRole('admin'));

adminRoutersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await RouterModel.find().sort({ createdAt: -1 });
    res.json({ items });
  })
);

const upsertSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(8728),
  username: z.string().min(1),
  password: z.string().min(1),
  tls: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

adminRoutersRouter.post(
  '/',
  validate(upsertSchema),
  asyncHandler(async (req, res) => {
    const router = await RouterModel.create({
      ...req.body,
      passwordEncrypted: encrypt(req.body.password),
    });
    res.status(201).json({ router });
  })
);

adminRoutersRouter.patch(
  '/:id',
  validate(upsertSchema.partial()),
  asyncHandler(async (req, res) => {
    const update: any = { ...req.body };
    if (update.password) {
      update.passwordEncrypted = encrypt(update.password);
      delete update.password;
    }
    const router = await RouterModel.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!router) throw NotFound('Router not found');
    res.json({ router });
  })
);

adminRoutersRouter.post(
  '/:id/ping',
  asyncHandler(async (req, res) => {
    const router = await RouterModel.findById(req.params.id);
    if (!router) throw NotFound('Router not found');
    try {
      const sessions = await mikrotikService.listActiveSessions(router);
      router.lastSeenAt = new Date();
      await router.save();
      res.json({ ok: true, sessions: sessions.length });
    } catch (err) {
      res.status(502).json({ ok: false, error: (err as Error).message });
    }
  })
);
