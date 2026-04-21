import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_NAME: z.string().default('Desh Communications'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  MONGODB_URI: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  // Customer accounts on an ISP platform should be created through the
  // admin / leads pipeline, not self-service. This flag stays `false` in
  // production; flip to `true` only for demos or local development where
  // you want anonymous signup.
  PUBLIC_REGISTRATION_ENABLED: z.coerce.boolean().default(false),

  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),

  LOG_LEVEL: z.string().default('info'),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe123!'),

  MIKROTIK_ENABLED: z.coerce.boolean().default(false),
  MIKROTIK_HOST: z.string().default('192.168.88.1'),
  MIKROTIK_PORT: z.coerce.number().default(8728),
  MIKROTIK_USER: z.string().default('api'),
  MIKROTIK_PASSWORD: z.string().default(''),
  MIKROTIK_TLS: z.coerce.boolean().default(false),

  RADIUS_ENABLED: z.coerce.boolean().default(false),
  RADIUS_HOST: z.string().default('127.0.0.1'),
  RADIUS_AUTH_PORT: z.coerce.number().default(1812),
  RADIUS_ACCT_PORT: z.coerce.number().default(1813),
  RADIUS_SECRET: z.string().default('testing123'),

  BKASH_MODE: z.enum(['mock', 'sandbox', 'live']).default('mock'),
  BKASH_APP_KEY: z.string().default(''),
  BKASH_APP_SECRET: z.string().default(''),
  BKASH_USERNAME: z.string().default(''),
  BKASH_PASSWORD: z.string().default(''),
  BKASH_BASE_URL: z.string().default('https://tokenized.sandbox.bka.sh/v1.2.0-beta'),
  BKASH_CALLBACK_URL: z.string().default('http://localhost:4000/api/payments/bkash/callback'),

  BILLING_CRON: z.string().default('0 2 * * *'),
  BILLING_GRACE_DAYS: z.coerce.number().default(3),

  DUNNING_CRON: z.string().default('30 2 * * *'),
  ROUTER_HEALTH_CRON: z.string().default('*/5 * * * *'),
  TICKET_SLA_CRON: z.string().default('15 * * * *'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
