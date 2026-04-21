import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

function makeStore(prefix: string) {
  // Only use Redis store if the client is ready — otherwise fall back to in-memory.
  if (redis.status !== 'ready') return undefined;
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as any,
  });
}

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: makeStore('rl:global:'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, try again later.' } },
  store: makeStore('rl:auth:'),
});

export const paymentLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: makeStore('rl:pay:'),
});
