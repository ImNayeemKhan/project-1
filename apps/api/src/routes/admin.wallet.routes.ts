import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { BadRequest, NotFound } from '../utils/errors';

export const adminWalletRouter = Router();
adminWalletRouter.use(requireAuth, requireRole('admin'));

adminWalletRouter.get(
  '/:userId',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId).select('name email walletBalance');
    if (!user) throw NotFound('User not found');
    const transactions = await Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ user, transactions });
  })
);

const adjustSchema = z.object({
  type: z.enum(['credit', 'debit']),
  amount: z.number().positive(),
  note: z.string().optional(),
});

adminWalletRouter.post(
  '/:userId/adjust',
  validate(adjustSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) throw NotFound('User not found');
    const { type, amount, note } = req.body as z.infer<typeof adjustSchema>;
    if (type === 'debit' && user.walletBalance < amount) throw BadRequest('Insufficient wallet balance');
    user.walletBalance = type === 'credit' ? user.walletBalance + amount : user.walletBalance - amount;
    await user.save();
    const txn = await Transaction.create({
      user: user._id,
      type,
      amount,
      reason: 'manual_adjustment',
      balanceAfter: user.walletBalance,
      note,
      createdBy: req.auth!.userId,
    });
    res.status(201).json({ user: { id: user._id, walletBalance: user.walletBalance }, transaction: txn });
  })
);
