import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { User } from '../models/User';
import { Package } from '../models/Package';
import { Zone } from '../models/Zone';
import { Announcement } from '../models/Announcement';
import { Lead } from '../models/Lead';
import { FtpServer } from '../models/FtpServer';
import { ServiceAddon } from '../models/ServiceAddon';

// Open-source Unsplash photos used for public marketing imagery.
// Each URL points at a stable photo ID served by Unsplash's CDN.
const IMG = {
  lite: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  basic: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80',
  standard: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  pro: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?auto=format&fit=crop&w=1200&q=80',
  business: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  enterprise: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  ftpMovies: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  ftpGames: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
  ftpCarrier: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=1200&q=80',
  ftpBusiness: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  ftpPartner: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  ftpEduCdn: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  addonStaticIp: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  addonIptv: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80',
  addonBackup: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  addonWifi: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
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

  const defaultFtp = [
    {
      name: 'Cinema Mirror',
      code: 'FTP-CINEMA',
      category: 'entertainment' as const,
      tagline: 'Movies and TV series at local bandwidth',
      description:
        'Large mirror of movies, TV series, documentaries, and anime. Access at full line speed ' +
        'for all active customers — does not count against FUP.',
      host: 'cinema.isp.local',
      webUrl: 'http://cinema.isp.local',
      port: 80,
      protocol: 'http' as const,
      accessLevel: 'customer' as const,
      capacityTB: 120,
      maxSpeedMbps: 10000,
      contentTypes: ['Movies', 'TV series', 'Anime', 'Documentaries'],
      features: ['Free at local bandwidth', 'Daily fresh releases', 'IMDB metadata'],
      imageUrl: IMG.ftpMovies,
      sortOrder: 10,
    },
    {
      name: 'Game & Software Mirror',
      code: 'FTP-GAMES',
      category: 'entertainment' as const,
      tagline: 'Steam updates, OS ISOs, dev tools',
      description:
        'Local mirror of popular game launchers, Linux distros, browsers, and developer SDKs. ' +
        'Saves international bandwidth and speeds up patch day.',
      host: 'mirror.isp.local',
      webUrl: 'http://mirror.isp.local',
      port: 80,
      protocol: 'http' as const,
      accessLevel: 'customer' as const,
      capacityTB: 60,
      maxSpeedMbps: 10000,
      contentTypes: ['Games', 'Software', 'Linux ISOs', 'SDKs'],
      features: ['Steam & Epic update cache', 'Ubuntu / Arch / Debian mirror', 'Unlimited downloads'],
      imageUrl: IMG.ftpGames,
      sortOrder: 20,
    },
    {
      name: 'Carrier Exchange',
      code: 'FTP-CARRIER',
      category: 'carrier' as const,
      tagline: 'Peering and upstream exchange',
      description:
        'Drop server for carrier / NTTN peers to exchange route objects, CDR samples, and ' +
        'configuration templates. Reachable over our transit and public IX peering.',
      host: 'xchg.isp.net',
      webUrl: 'https://xchg.isp.net',
      port: 443,
      protocol: 'https' as const,
      accessLevel: 'partner' as const,
      capacityTB: 40,
      maxSpeedMbps: 40000,
      contentTypes: ['Route objects', 'CDR samples', 'Network templates'],
      features: ['Dual-stack IPv4/IPv6', 'mTLS access', 'RPKI-validated prefixes'],
      imageUrl: IMG.ftpCarrier,
      sortOrder: 30,
    },
    {
      name: 'Business File Vault',
      code: 'FTP-BIZ',
      category: 'business' as const,
      tagline: 'Secure file transfer for business plans',
      description:
        'High-throughput SFTP/HTTPS vault for business customers — nightly automated backups, ' +
        'large-file dropbox for client handoffs, and encrypted at rest.',
      host: 'vault.isp.net',
      webUrl: 'https://vault.isp.net',
      port: 443,
      protocol: 'https' as const,
      accessLevel: 'business' as const,
      capacityTB: 30,
      maxSpeedMbps: 2000,
      contentTypes: ['File transfer', 'Automated backup', 'Shared folders'],
      features: ['Per-user quotas', 'AES-256 at rest', 'Daily snapshot retention'],
      imageUrl: IMG.ftpBusiness,
      sortOrder: 40,
    },
    {
      name: 'Partner CDN Drop',
      code: 'FTP-PARTNER',
      category: 'partnership' as const,
      tagline: 'Content partner ingest',
      description:
        'Origin ingest server for OTT and publisher partners. Push content here once and we ' +
        'replicate it to every POP, so your users inside our network get it at local speeds.',
      host: 'partner.isp.net',
      webUrl: 'https://partner.isp.net',
      port: 443,
      protocol: 'https' as const,
      accessLevel: 'partner' as const,
      capacityTB: 80,
      maxSpeedMbps: 40000,
      contentTypes: ['OTT video', 'Live streams', 'Software releases'],
      features: ['Edge cache replication', 'Signed-URL ingest', 'Per-partner reporting'],
      imageUrl: IMG.ftpPartner,
      sortOrder: 50,
    },
    {
      name: 'Education Mirror',
      code: 'FTP-EDU',
      category: 'partnership' as const,
      tagline: 'University and academic content',
      description:
        'Joint mirror with partner universities — open courseware, research datasets, ' +
        'academic software. Open to every customer free of cost.',
      host: 'edu.isp.net',
      webUrl: 'https://edu.isp.net',
      port: 443,
      protocol: 'https' as const,
      accessLevel: 'public' as const,
      capacityTB: 20,
      maxSpeedMbps: 10000,
      contentTypes: ['Courseware', 'Datasets', 'Academic software'],
      features: ['Open to all', 'Mirrored weekly', 'HTTPS + rsync'],
      imageUrl: IMG.ftpEduCdn,
      sortOrder: 60,
    },
  ];

  for (const f of defaultFtp) {
    const exists = await FtpServer.findOne({ code: f.code });
    if (!exists) {
      await FtpServer.create(f);
      logger.info('Seeded FTP server', { code: f.code });
    }
  }

  const defaultAddons = [
    {
      name: 'Dedicated Static IP',
      code: 'ADDON-STATICIP',
      category: 'ip' as const,
      tagline: 'Your own public IPv4',
      description:
        'Run servers, VPNs, or CCTV DVRs reachable from anywhere. We reserve a dedicated ' +
        'IPv4 address on your line and terminate it on your router.',
      monthlyPrice: 500,
      setupFee: 500,
      features: ['Dedicated IPv4', 'Reverse DNS on request', 'Port forwarding supported'],
      imageUrl: IMG.addonStaticIp,
      sortOrder: 10,
    },
    {
      name: 'IPTV Bundle',
      code: 'ADDON-IPTV',
      category: 'iptv' as const,
      tagline: '150+ live channels over your line',
      description:
        'Sports, news, entertainment, and regional channels delivered over your existing ' +
        'connection. Works on our app for Android TV, Fire TV, iOS, and the web.',
      monthlyPrice: 300,
      setupFee: 0,
      features: ['150+ channels', 'Catch-up TV (48h)', 'Up to 4 simultaneous devices'],
      imageUrl: IMG.addonIptv,
      sortOrder: 20,
    },
    {
      name: 'Cloud Backup',
      code: 'ADDON-BACKUP',
      category: 'backup' as const,
      tagline: 'Automated daily backups to our vault',
      description:
        'Encrypted, deduplicated daily backup of your laptop, PC, or small business server. ' +
        'Restore from any day in the last 30 days.',
      monthlyPrice: 400,
      setupFee: 0,
      features: ['200 GB quota', 'AES-256 encrypted', '30-day retention'],
      imageUrl: IMG.addonBackup,
      sortOrder: 30,
    },
    {
      name: 'Managed Wi-Fi',
      code: 'ADDON-WIFI',
      category: 'wifi' as const,
      tagline: 'Whole-home mesh, managed by us',
      description:
        'We install and operate a dual-band mesh Wi-Fi system on your premises. Device-level ' +
        'controls and parental filters from the customer portal.',
      monthlyPrice: 350,
      setupFee: 1500,
      features: ['Up to 3 mesh nodes', 'Guest network', 'Parental controls'],
      imageUrl: IMG.addonWifi,
      sortOrder: 40,
    },
  ];

  for (const a of defaultAddons) {
    const exists = await ServiceAddon.findOne({ code: a.code });
    if (!exists) {
      await ServiceAddon.create(a);
      logger.info('Seeded add-on', { code: a.code });
    }
  }

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Seed failed', { err: (err as Error).message });
  process.exit(1);
});
