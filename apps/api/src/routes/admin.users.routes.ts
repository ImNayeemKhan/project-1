import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { User } from '../models/User';
import { env } from '../config/env';
import { Conflict, NotFound } from '../utils/errors';

export const adminUsersRouter = Router();
adminUsersRouter.use(requireAuth, requireRole('admin'));

const listSchema = z.object({
  q: z.string().optional(),
  role: z.enum(['admin', 'reseller', 'customer']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

adminUsersRouter.get(
  '/',
  validate(listSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { q, role, page, limit } = req.query as any;
    const filter: any = {};
    if (role) filter.role = role;
    if (q) filter.$or = [{ email: new RegExp(q, 'i') }, { name: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }];
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-passwordHash'),
      User.countDocuments(filter),
    ]);
    res.json({ items, total, page, limit });
  })
);

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['admin', 'reseller', 'customer']).default('customer'),
});

adminUsersRouter.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const existing = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existing) throw Conflict('Email already registered');
    const passwordHash = await bcrypt.hash(req.body.password, env.BCRYPT_ROUNDS);
    const user = await User.create({
      email: req.body.email.toLowerCase(),
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role,
      passwordHash,
    });
    res.status(201).json({ user: { ...user.toObject(), passwordHash: undefined } });
  })
);

const updateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['admin', 'reseller', 'customer']).optional(),
  password: z.string().min(8).optional(),
});

adminUsersRouter.patch(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const update: any = { ...req.body };
    if (update.password) {
      update.passwordHash = await bcrypt.hash(update.password, env.BCRYPT_ROUNDS);
      delete update.password;
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
    if (!user) throw NotFound('User not found');
    res.json({ user });
  })
);

adminUsersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) throw NotFound('User not found');
    res.json({ ok: true });
  })
);
