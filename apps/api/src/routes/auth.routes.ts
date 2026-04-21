import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { authService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { User } from '../models/User';
import { NotFound } from '../utils/errors';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

authRouter.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json({
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  })
);

authRouter.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password, {
      ip: req.ip,
      ua: req.get('user-agent') ?? undefined,
    });
    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  })
);

authRouter.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const { accessToken } = await authService.refresh(req.body.refreshToken);
    res.json({ accessToken });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.auth!.userId).select('-passwordHash');
    if (!user) throw NotFound('User not found');
    res.json({ user });
  })
);
