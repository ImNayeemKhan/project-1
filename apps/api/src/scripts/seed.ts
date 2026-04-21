import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { User } from '../models/User';
import { Package } from '../models/Package';
import { Zone } from '../models/Zone';
import { Announcement } from '../models/Announcement';
import { Lead } from '../models/Lead';

// Open-source Unsplash photos used for public marketing imagery.
// Each URL points at a stable photo ID served by Unsplash's CDN.
const IMG = {
  lite: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  basic: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80',
  standard: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  pro: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?auto=format&fit=crop&w=1200&q=80',
  business: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  enterprise: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
};

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
    {
      name: 'Lite',
      code: 'LITE5',
      tagline: 'Essential browsing for light users',
      description: 'Perfect for one-device browsing, email, and light streaming.',
      imageUrl: IMG.lite,
      downloadMbps: 5,
      uploadMbps: 3,
      monthlyPrice: 400,
      setupFee: 500,
      fupGB: 100,
      features: ['1 device recommended', 'Email + social', 'SD video streaming', 'Free installation'],
      sortOrder: 10,
    },
    {
      name: 'Home Basic',
      code: 'HOME10',
      tagline: 'Everyday home internet',
      description: 'Great for a small family — video calls, HD streaming, work from home.',
      imageUrl: IMG.basic,
      downloadMbps: 10,
      uploadMbps: 5,
      monthlyPrice: 600,
      setupFee: 500,
      fupGB: 300,
      features: ['Up to 3 devices', 'HD streaming', 'Video calls', '24/7 support'],
      sortOrder: 20,
    },
    {
      name: 'Home Standard',
      code: 'HOME20',
      tagline: 'The crowd favourite',
      description: 'Balanced speed and price. Ideal for families with multiple devices.',
      imageUrl: IMG.standard,
      downloadMbps: 20,
      uploadMbps: 10,
      monthlyPrice: 1000,
      setupFee: 500,
      fupGB: 600,
      features: ['Up to 6 devices', 'Full HD streaming', 'Online gaming', 'Priority support'],
      isFeatured: true,
      sortOrder: 30,
    },
    {
      name: 'Home Pro',
      code: 'HOME50',
      tagline: 'Power user speeds',
      description: '4K streaming, remote work, large downloads — no throttle.',
      imageUrl: IMG.pro,
      downloadMbps: 50,
      uploadMbps: 25,
      monthlyPrice: 1800,
      setupFee: 0,
      fupGB: 1500,
      features: ['Up to 15 devices', '4K streaming', 'Competitive gaming', 'Free installation'],
      sortOrder: 40,
    },
    {
      name: 'Business 50',
      code: 'BIZ50',
      tagline: 'Shops and small offices',
      description: 'Static IP on request, low-latency, business-grade SLA.',
      imageUrl: IMG.business,
      downloadMbps: 50,
      uploadMbps: 50,
      monthlyPrice: 2500,
      setupFee: 0,
      features: ['Symmetrical speed', 'Static IP available', 'Business SLA', 'Priority ticket response'],
      sortOrder: 50,
    },
    {
      name: 'Enterprise 100',
      code: 'ENT100',
      tagline: 'For growing businesses',
      description: 'Dedicated support, multi-site routing, 99.9% uptime SLA.',
      imageUrl: IMG.enterprise,
      downloadMbps: 100,
      uploadMbps: 100,
      monthlyPrice: 5000,
      setupFee: 0,
      features: ['Dedicated account manager', '99.9% uptime SLA', 'Multi-site routing', 'Static IP block'],
      sortOrder: 60,
    },
  ];

  for (const p of defaultPackages) {
    const exists = await Package.findOne({ code: p.code });
    if (!exists) {
      await Package.create(p);
      logger.info('Seeded package', { code: p.code });
    }
  }

  const defaultZones = [
    { name: 'Dhanmondi', code: 'DHN', city: 'Dhaka', description: 'Central Dhaka — Dhanmondi 27 to Mirpur Road' },
    { name: 'Uttara', code: 'UTR', city: 'Dhaka', description: 'Sector 1 to Sector 14, Uttara' },
    { name: 'Gulshan', code: 'GUL', city: 'Dhaka', description: 'Gulshan 1 and 2, Banani' },
    { name: 'Mirpur', code: 'MIR', city: 'Dhaka', description: 'Mirpur 1 to Mirpur 14' },
  ];

  for (const z of defaultZones) {
    const exists = await Zone.findOne({ code: z.code });
    if (!exists) {
      await Zone.create(z);
      logger.info('Seeded zone', { code: z.code });
    }
  }

  const announcementCount = await Announcement.countDocuments();
  if (announcementCount === 0) {
    await Announcement.create([
      {
        title: 'Welcome to our new customer portal',
        body: 'You can now view invoices, raise support tickets, and pay with bKash online.',
        audience: 'all',
        severity: 'info',
        isPinned: true,
      },
      {
        title: 'Scheduled maintenance: core router upgrade',
        body: 'On the last Saturday of the month, expect brief outages between 02:00 and 04:00 (BST).',
        audience: 'active',
        severity: 'warning',
      },
      {
        title: 'Your service is suspended — settle outstanding invoices',
        body: 'Please clear your outstanding invoice from the customer portal to restore service.',
        audience: 'suspended',
        severity: 'critical',
      },
    ]);
    logger.info('Seeded announcements');
  }

  const leadCount = await Lead.countDocuments();
  if (leadCount === 0) {
    await Lead.create([
      {
        name: 'Rahim Ahmed',
        phone: '+8801700000001',
        email: 'rahim@example.com',
        address: 'House 7, Road 4, Dhanmondi',
        status: 'new',
        source: 'website',
        notes: 'Interested in Home Standard',
      },
      {
        name: 'Green Cafe',
        phone: '+8801700000002',
        address: 'Gulshan 2, Dhaka',
        status: 'contacted',
        source: 'walkin',
        notes: 'Asked about Business plan with static IP',
      },
    ]);
    logger.info('Seeded leads');
  }

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Seed failed', { err: (err as Error).message });
  process.exit(1);
});
