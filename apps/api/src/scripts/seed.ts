import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { User } from '../models/User';
import { Package } from '../models/Package';

async function main() {
  await connectDB();

  const existingAdmin = await User.findOne({ email: env.SEED_ADMIN_EMAIL });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, env.BCRYPT_ROUNDS);
    await User.create({
      email: env.SEED_ADMIN_EMAIL,
      name: 'Administrator',
      role: 'admin',
      passwordHash,
    });
    logger.info('Seeded admin user', { email: env.SEED_ADMIN_EMAIL });
  } else {
    logger.info('Admin user already exists');
  }

  const defaultPackages = [
    { name: 'Home 10', code: 'HOME10', downloadMbps: 10, uploadMbps: 5, monthlyPrice: 600 },
    { name: 'Home 20', code: 'HOME20', downloadMbps: 20, uploadMbps: 10, monthlyPrice: 1000 },
    { name: 'Business 50', code: 'BIZ50', downloadMbps: 50, uploadMbps: 25, monthlyPrice: 2500 },
  ];

  for (const p of defaultPackages) {
    const exists = await Package.findOne({ code: p.code });
    if (!exists) {
      await Package.create(p);
      logger.info('Seeded package', { code: p.code });
    }
  }

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Seed failed', { err: (err as Error).message });
  process.exit(1);
});
