// Vercel serverless entry point for the Desh Communications API.
//
// File-based routing: Vercel exposes `api/[[...path]].ts` at `/api/*` and
// forwards every incoming request here. We export the Express app
// directly — Vercel's Node.js runtime detects Express apps and invokes
// `app(req, res)` for each request without a Lambda-style wrapper.
//
// Notes:
// - Background jobs (billing / dunning / router-health / ticket SLA cron
//   workers in `apps/api/src/server.ts`) are deliberately NOT started
//   here. Vercel serverless functions are short-lived; cron is external.
// - `connectDB()` caches its promise on `globalThis`, so a warm function
//   re-uses the open Mongoose connection across requests. Mongoose
//   buffers commands until the connection is ready, so DB-free routes
//   like `/api/health` respond immediately even on cold start.
// - Redis is absent on Vercel (no REDIS_URL). The app's rate-limit
//   middleware already falls back to in-memory counters when Redis is
//   unreachable, which is acceptable for a test preview.

import { buildApp } from '../src/app';
import { connectDB } from '../src/config/db';
import { logger } from '../src/config/logger';

const app = buildApp();

// Kick off Mongo connection in the background. Mongoose buffers
// commands until the connection is ready.
connectDB().catch((err) => logger.error('Mongo connect failed', { err: (err as Error).message }));

export default app;

export const config = {
  maxDuration: 10,
};
