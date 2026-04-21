import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

// In serverless (Vercel) environments the module is re-evaluated per cold
// start but a warm invocation re-uses the same process — we cache the
// connection promise on `globalThis` so repeated invocations share one
// pooled connection instead of opening a new one every request.
interface MongoCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}
const globalWithMongo = globalThis as unknown as { __mongoCache?: MongoCache };
const cache: MongoCache = globalWithMongo.__mongoCache ?? { conn: null, promise: null };
globalWithMongo.__mongoCache = cache;

export async function connectDB(): Promise<void> {
  if (cache.conn) return;

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        autoIndex: env.NODE_ENV !== 'production',
      })
      .then((m) => {
        logger.info('MongoDB connected');
        m.connection.on('error', (err) => logger.error('MongoDB error', { err }));
        m.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
          cache.conn = null;
          cache.promise = null;
        });
        return m;
      })
      // If the initial connection fails (e.g. Atlas is briefly unreachable
      // during a cold start), drop the cached rejection so the next call
      // to connectDB can attempt a fresh connection. Without this, the
      // rejected promise stays cached forever and every subsequent
      // request keeps re-throwing the original error until the process
      // is recycled.
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    // Extra safety: clear on re-throw path too so concurrent callers that
    // entered before .catch ran don't keep a dead handle.
    cache.promise = null;
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  if (cache.conn) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}
