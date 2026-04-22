import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { FtpServer } from '../models/FtpServer';
import { Subscription } from '../models/Subscription';

export const customerFtpRouter = Router();
customerFtpRouter.use(requireAuth, requireRole('customer'));

customerFtpRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    // Figure out what access tier(s) this customer is entitled to.
    // Everyone active gets `public` + `customer`. Business-class subscribers
    // (monthlyPrice >= 2500 ৳ — roughly the Business/Enterprise tier) also
    // get `business` mirrors.
    const subs = await Subscription.find({
      customer: req.auth!.userId,
      status: 'active',
    }).populate('package', 'monthlyPrice');

    const hasActive = subs.length > 0;
    const hasBusiness = subs.some((s) => {
      const pkg = s.package as unknown as { monthlyPrice?: number } | null;
      return (pkg?.monthlyPrice ?? 0) >= 2500;
    });

    const levels: string[] = ['public'];
    if (hasActive) levels.push('customer');
    if (hasBusiness) levels.push('business');

    const items = await FtpServer.find({
      isActive: true,
      accessLevel: { $in: levels },
    }).sort({ category: 1, sortOrder: 1, name: 1 });

    res.json({ accessLevels: levels, items });
  })
);
