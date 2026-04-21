import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { redis } from '../config/redis';
import { Router as RouterModel } from '../models/Router';
import { mikrotikService } from '../services/mikrotik.service';
import { env } from '../config/env';

export const adminHealthRouter = Router();
adminHealthRouter.use(requireAuth, requireRole('admin'));

interface Check {
  name: string;
  status: 'up' | 'degraded' | 'down' | 'skipped';
  detail?: string;
  latencyMs?: number;
}

adminHealthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const checks: Check[] = [];

    // MongoDB
    {
      const t = Date.now();
      try {
        const state = mongoose.connection.readyState;
        if (state === 1) {
          await mongoose.connection.db!.admin().ping();
          checks.push({ name: 'MongoDB', status: 'up', latencyMs: Date.now() - t });
        } else {
          checks.push({
            name: 'MongoDB',
            status: 'down',
            detail: `readyState=${state}`,
          });
        }
      } catch (err) {
        checks.push({ name: 'MongoDB', status: 'down', detail: (err as Error).message });
      }
    }

    // Redis
    {
      const t = Date.now();
      try {
        await redis.ping();
        checks.push({ name: 'Redis', status: 'up', latencyMs: Date.now() - t });
      } catch (err) {
        checks.push({ name: 'Redis', status: 'down', detail: (err as Error).message });
      }
    }

    // Routers (MikroTik) — sample the first router.
    {
      const r = await RouterModel.findOne();
      if (!r) {
        checks.push({ name: 'MikroTik', status: 'skipped', detail: 'No routers configured' });
      } else {
        try {
          const result = await mikrotikService.ping(r);
          checks.push({
            name: `MikroTik (${r.name})`,
            status: result.ok ? 'up' : 'down',
            detail: result.error,
            latencyMs: result.latencyMs,
          });
        } catch (err) {
          checks.push({
            name: `MikroTik (${r.name})`,
            status: 'down',
            detail: (err as Error).message,
          });
        }
      }
    }

    // RADIUS is feature-flagged; no runtime connectivity probe.
    checks.push({
      name: 'RADIUS',
      status: env.RADIUS_ENABLED ? 'up' : 'skipped',
      detail: env.RADIUS_ENABLED ? undefined : 'Disabled in env',
    });

    const overall = checks.some((c) => c.status === 'down')
      ? 'down'
      : checks.some((c) => c.status === 'degraded')
      ? 'degraded'
      : 'up';
    res.json({ overall, checks, timestamp: new Date() });
  })
);
