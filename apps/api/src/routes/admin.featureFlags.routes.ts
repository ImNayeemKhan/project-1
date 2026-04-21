import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { FeatureFlag } from '../models/FeatureFlag';
import { AuditLog } from '../models/AuditLog';
import { NotFound } from '../utils/errors';

export const adminFeatureFlagsRouter = Router();
adminFeatureFlagsRouter.use(requireAuth, requireRole('admin'));

adminFeatureFlagsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await FeatureFlag.find().sort({ key: 1 });
    res.json({ items });
  })
);

const upsertSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9_.-]+$/i, 'Use letters, digits, dot, underscore, hyphen'),
  description: z.string().max(500).optional(),
  enabled: z.boolean(),
  rolloutPercent: z.number().int().min(0).max(100).default(100),
  audience: z.enum(['all', 'admins', 'customers', 'resellers']).default('all'),
});

adminFeatureFlagsRouter.post(
  '/',
  validate(upsertSchema),
  asyncHandler(async (req, res) => {
    const flag = await FeatureFlag.findOneAndUpdate({ key: req.body.key }, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
    await AuditLog.create({
      actor: req.auth!.userId,
      actorRole: req.auth!.role,
      action: 'feature_flag.upsert',
      target: flag.key,
      meta: { enabled: flag.enabled, rolloutPercent: flag.rolloutPercent, audience: flag.audience },
    });
    res.json({ flag });
  })
);

adminFeatureFlagsRouter.delete(
  '/:key',
  asyncHandler(async (req, res) => {
    const flag = await FeatureFlag.findOneAndDelete({ key: req.params.key });
    if (!flag) throw NotFound('Flag not found');
    await AuditLog.create({
      actor: req.auth!.userId,
      actorRole: req.auth!.role,
      action: 'feature_flag.delete',
      target: flag.key,
    });
    res.json({ ok: true });
  })
);
