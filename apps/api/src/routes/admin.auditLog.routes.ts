import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { AuditLog } from '../models/AuditLog';
import { escapeRegex } from '../utils/regex';

export const adminAuditLogRouter = Router();
adminAuditLogRouter.use(requireAuth, requireRole('admin'));

adminAuditLogRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { action, actor, target, from, to } = req.query;
    const limit = Math.min(200, Number(req.query.limit ?? 100));
    const filter: Record<string, unknown> = {};
    if (typeof action === 'string' && action) filter.action = action;
    if (typeof actor === 'string' && actor) filter.actor = actor;
    if (typeof target === 'string' && target)
      filter.target = { $regex: escapeRegex(target), $options: 'i' };
    if (from || to) {
      const range: Record<string, Date> = {};
      if (typeof from === 'string' && from) range.$gte = new Date(from);
      if (typeof to === 'string' && to) range.$lte = new Date(to);
      filter.createdAt = range;
    }

    const items = await AuditLog.find(filter)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const actions = await AuditLog.distinct('action');
    res.json({ items, actions });
  })
);
