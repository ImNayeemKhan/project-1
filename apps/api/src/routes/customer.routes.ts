import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { Subscription } from '../models/Subscription';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';
import { NotFound } from '../utils/errors';

export const customerRouter = Router();
customerRouter.use(requireAuth, requireRole('customer'));

customerRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth!.userId).select('-passwordHash');
    if (!user) throw NotFound('User not found');
    const subscriptions = await Subscription.find({ customer: user._id }).populate(
      'package',
      'name code monthlyPrice downloadMbps uploadMbps'
    );
    res.json({ user, subscriptions });
  })
);

customerRouter.get(
  '/invoices',
  asyncHandler(async (req, res) => {
    const items = await Invoice.find({ customer: req.auth!.userId })
      .populate('subscription', 'pppoeUsername')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ items });
  })
);

customerRouter.get(
  '/invoices/:id',
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, customer: req.auth!.userId });
    if (!invoice) throw NotFound('Invoice not found');
    res.json({ invoice });
  })
);
