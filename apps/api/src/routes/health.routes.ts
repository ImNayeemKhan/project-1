import { Router } from 'express';
import mongoose from 'mongoose';
import { redis } from '../config/redis';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

healthRouter.get('/ready', async (_req, res) => {
  const db = mongoose.connection.readyState === 1;
  const cache = redis.status === 'ready';
  res.status(db ? 200 : 503).json({ db, cache });
});
