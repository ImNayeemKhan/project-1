import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import type { Request } from 'express';
import { redis } from '../config/redis';

// Redis stores must be built AFTER initRedis() has connected the client.
// Call buildLimiters() from buildApp(), not at module load time.
function makeStore(prefix: string) {
  if (redis.status !== 'ready') return undefined;
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as any,
  });
}

// In serverless environments (Vercel), `request.ip` is not populated by
// the socket — the client address is only available via the
// `x-forwarded-for` header. Provide a keyGenerator that reads it
// directly so the rate limiter doesn't throw
// `ERR_ERL_UNDEFINED_IP_ADDRESS` on every request.
function clientKey(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim();
  if (Array.isArray(xff) && xff.length > 0) return xff[0];
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

export interface RateLimiters {
  global: RateLimitRequestHandler;
  auth: RateLimitRequestHandler;
  payment: RateLimitRequestHandler;
}

export function buildLimiters(): RateLimiters {
  return {
    global: rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      keyGenerator: clientKey,
      validate: false,
      store: makeStore('rl:global:'),
    }),
    auth: rateLimit({
      windowMs: 15 * 60_000,
      limit: 10,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      keyGenerator: clientKey,
      validate: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, try again later.' } },
      store: makeStore('rl:auth:'),
    }),
    payment: rateLimit({
      windowMs: 60_000,
      limit: 20,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      keyGenerator: clientKey,
      validate: false,
      store: makeStore('rl:pay:'),
    }),
  };
}
