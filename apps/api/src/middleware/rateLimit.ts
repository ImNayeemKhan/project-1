import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
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
      store: makeStore('rl:global:'),
    }),
    auth: rateLimit({
      windowMs: 15 * 60_000,
      limit: 10,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, try again later.' } },
      store: makeStore('rl:auth:'),
    }),
    payment: rateLimit({
      windowMs: 60_000,
      limit: 20,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      store: makeStore('rl:pay:'),
    }),
  };
}
