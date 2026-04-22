import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Subscription } from '../models/Subscription';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { KycDocument } from '../models/KycDocument';
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

const profileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().min(5).max(40).optional(),
  address: z.string().max(400).optional(),
  nid: z.string().max(40).optional(),
});

customerRouter.patch(
  '/me',
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.auth!.userId, req.body, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');
    if (!user) throw NotFound('User not found');
    res.json({ user });
  })
);

customerRouter.get(
  '/wallet',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth!.userId).select('walletBalance');
    const transactions = await Transaction.find({ user: req.auth!.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ balance: user?.walletBalance ?? 0, transactions });
  })
);

customerRouter.get(
  '/kyc',
  asyncHandler(async (req, res) => {
    const items = await KycDocument.find({ customer: req.auth!.userId }).sort({ createdAt: -1 });
    res.json({ items });
  })
);
