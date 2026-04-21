import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User, UserRole } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { Unauthorized, Conflict } from '../utils/errors';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth';

export const authService = {
  async register(input: { email: string; password: string; name: string; phone?: string; role?: UserRole }) {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) throw Conflict('Email already registered');
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
    const user = await User.create({
      email: input.email.toLowerCase(),
      name: input.name,
      phone: input.phone,
      role: input.role ?? 'customer',
      passwordHash,
    });
    return user;
  },

  async login(email: string, password: string, ctx: { ip?: string; ua?: string }) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) throw Unauthorized('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw Unauthorized('Invalid credentials');

    user.lastLoginAt = new Date();
    await user.save();

    await AuditLog.create({
      actor: user._id,
      actorRole: user.role,
      action: 'auth.login',
      ip: ctx.ip,
      userAgent: ctx.ua,
    });

    const accessToken = signAccessToken({ sub: String(user._id), role: user.role, email: user.email });
    const refreshToken = signRefreshToken({ sub: String(user._id) });
    return { user, accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw Unauthorized('Invalid refresh token');
    }
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw Unauthorized();
    const accessToken = signAccessToken({ sub: String(user._id), role: user.role, email: user.email });
    return { accessToken };
  },
};
