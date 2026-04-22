import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { Announcement } from '../models/Announcement';
import { Subscription } from '../models/Subscription';

export const customerAnnouncementsRouter = Router();
customerAnnouncementsRouter.use(requireAuth, requireRole('customer'));

customerAnnouncementsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const subs = await Subscription.find({ customer: req.auth!.userId }).select('status');
    const hasSuspended = subs.some((s) => s.status === 'suspended');
    const hasActive = subs.some((s) => s.status === 'active');

    const audiences: string[] = ['all'];
    if (hasActive) audiences.push('active');
    if (hasSuspended) audiences.push('suspended');

    const items = await Announcement.find({
      audience: { $in: audiences },
      publishedAt: { $lte: now },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ isPinned: -1, publishedAt: -1 })
      .limit(50);
    res.json({ items });
  })
);
