import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { logger } from './config/logger';
import { buildApiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { buildLimiters } from './middleware/rateLimit';

export function buildApp() {
  // IMPORTANT: build limiters AFTER initRedis() has run so they bind to the
  // live Redis store instead of silently falling back to in-memory counters.
  const limiters = buildLimiters();

  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: false, // CSP is set at the NGINX edge.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(
    morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.http?.(msg.trim()) ?? logger.info(msg.trim()) },
    })
  );

  app.use(limiters.global);

  app.use('/api', buildApiRouter(limiters));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
