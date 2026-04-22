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
  // Personal tiers (home fiber)
  personalEntry: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  personalStream: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80',
  personalStandard: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  personalPro: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?auto=format&fit=crop&w=1200&q=80',
  personalGold: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  personalPlatinum: 'https://images.unsplash.com/photo-1573164574472-797cdf4a583a?auto=format&fit=crop&w=1200&q=80',
  // Corporate
  sme: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  smeElite: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&q=80',
  smeEconomy: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  // Gaming
  gameStarter: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  gamePro: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
  // FTP / BDIX mirrors
  ftpMovies: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  ftpGames: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
  ftpCarrier: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=1200&q=80',
  ftpBusiness: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  ftpPartner: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  ftpEduCdn: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  // Add-ons
  addonStaticIp: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  addonIptv: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80',
  addonBackup: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  addonWifi: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
};

// Features shared across every personal plan (mirrors deshcommunications.net).
const PERSONAL_FEATURES = [
  'Fiber Optic Connection',
  'Unlimited BDIX and Other Cache',
  'Bufferless HD, FHD, 4K Video',
  'IPv6 Public IP',
  '1:8 Contention Ratio',
  '24/7 Call Center Support',
];

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

  // Package catalog mirrors the live Desh Communications pricing grid from
  // deshcommunications.net/packages. Prices are BDT/month including 5% VAT.
  const defaultPackages = [
    // --- Personal tier -------------------------------------------------------
    {
      name: 'Basic',
      code: 'DESH-PER-BASIC',
      category: 'personal' as const,
      tagline: '25 Mbps fiber for everyday use',
      description: 'Everyday home internet on our fiber network. Includes unlimited BDIX at full line speed.',
      imageUrl: IMG.personalEntry,
      downloadMbps: 25,
      uploadMbps: 25,
      monthlyPrice: 525,
      setupFee: 0,
      features: ['Speed: 25 Mbps', ...PERSONAL_FEATURES],
      sortOrder: 10,
    },
    {
      name: 'Blaze',
      code: 'DESH-PER-BLAZE',
      category: 'personal' as const,
      tagline: '30 Mbps for small families',
      description: 'Comfortable HD streaming, video calls, and online gaming for a small family.',
      imageUrl: IMG.personalEntry,
      downloadMbps: 30,
      uploadMbps: 30,
      monthlyPrice: 630,
      setupFee: 0,
      features: ['Speed: 30 Mbps', ...PERSONAL_FEATURES],
      sortOrder: 20,
    },
    {
      name: 'Bronze',
      code: 'DESH-PER-BRONZE',
      category: 'personal' as const,
      tagline: '40 Mbps — the sweet spot',
      description: 'Plenty of bandwidth for multi-device homes, 4K streaming, and big downloads.',
      imageUrl: IMG.personalStream,
      downloadMbps: 40,
      uploadMbps: 40,
      monthlyPrice: 735,
      setupFee: 0,
      features: ['Speed: 40 Mbps', ...PERSONAL_FEATURES],
      sortOrder: 30,
    },
    {
      name: 'Comfort',
      code: 'DESH-PER-COMFORT',
      category: 'personal' as const,
      tagline: '50 Mbps for busy households',
      description: 'Crowd favourite. Balanced speed and price — ideal for families with 8–10 devices.',
      imageUrl: IMG.personalStandard,
      downloadMbps: 50,
      uploadMbps: 50,
      monthlyPrice: 840,
      setupFee: 0,
      features: ['Speed: 50 Mbps', ...PERSONAL_FEATURES],
      isFeatured: true,
      sortOrder: 40,
    },
    {
      name: 'Turbo',
      code: 'DESH-PER-TURBO',
      category: 'personal' as const,
      tagline: '60 Mbps for power users',
      description: 'Smooth 4K streaming, low-latency gaming, and work-from-home without compromise.',
      imageUrl: IMG.personalStandard,
      downloadMbps: 60,
      uploadMbps: 60,
      monthlyPrice: 1050,
      setupFee: 0,
      features: ['Speed: 60 Mbps', ...PERSONAL_FEATURES],
      sortOrder: 50,
    },
    {
      name: 'Signature',
      code: 'DESH-PER-SIGNATURE',
      category: 'personal' as const,
      tagline: '70 Mbps for large homes',
      description: 'Premium fiber speed for larger homes with heavy streaming and multiple gamers.',
      imageUrl: IMG.personalPro,
      downloadMbps: 70,
      uploadMbps: 70,
      monthlyPrice: 1260,
      setupFee: 0,
      features: ['Speed: 70 Mbps', ...PERSONAL_FEATURES],
      sortOrder: 60,
    },
    {
      name: 'Gold',
      code: 'DESH-PER-GOLD',
      category: 'personal' as const,
      tagline: '80 Mbps premium',
      description: 'Our premium personal tier — for power users and content creators.',
      imageUrl: IMG.personalGold,
      downloadMbps: 80,
      uploadMbps: 80,
      monthlyPrice: 1575,
      setupFee: 0,
      features: ['Speed: 80 Mbps', ...PERSONAL_FEATURES],
      sortOrder: 70,
    },
    {
      name: 'Platinum',
      code: 'DESH-PER-PLATINUM',
      category: 'personal' as const,
      tagline: '100 Mbps for heavy users',
      description: 'Triple-digit fiber for heavy uploaders, streamers, and multi-worker homes.',
      imageUrl: IMG.personalPlatinum,
      downloadMbps: 100,
      uploadMbps: 100,
      monthlyPrice: 2100,
      setupFee: 0,
      features: ['Speed: 100 Mbps', ...PERSONAL_FEATURES],
      sortOrder: 80,
    },
    {
      name: 'Diamond',
      code: 'DESH-PER-DIAMOND',
      category: 'personal' as const,
      tagline: '130 Mbps — flagship home plan',
      description: 'Our flagship home plan. Maximum fiber speed on a 1:8 contention ratio.',
      imageUrl: IMG.personalPlatinum,
      downloadMbps: 130,
      uploadMbps: 130,
      monthlyPrice: 3150,
      setupFee: 0,
      features: ['Speed: 130 Mbps', ...PERSONAL_FEATURES],
      sortOrder: 90,
    },

    // --- Corporate tier ------------------------------------------------------
    {
      name: 'SME — Basic (30 Mbps)',
      code: 'DESH-SME-BASIC',
      category: 'corporate' as const,
      tagline: 'Dedicated bandwidth for small offices',
      description: 'Dedicated 30 Mbps bandwidth with 100% speed consistency for shops and small offices.',
      imageUrl: IMG.sme,
      downloadMbps: 30,
      uploadMbps: 30,
      monthlyPrice: 3000,
      setupFee: 0,
      features: [
        'Dedicated Bandwidth',
        '100% Speed Consistency',
        'Fiber Optic Connection',
        'Multiple Upstream',
        'Redundancy: No',
        'Priority Tech Support',
        'Digital Payment System',
        '24/7 Call Center',
      ],
      sortOrder: 100,
    },
    {
      name: 'SME — Elite (50 Mbps)',
      code: 'DESH-SME-ELITE',
      category: 'corporate' as const,
      tagline: 'Dedicated + redundant for growing businesses',
      description: 'Dedicated 50 Mbps bandwidth with upstream redundancy — ideal for growing businesses.',
      imageUrl: IMG.smeElite,
      downloadMbps: 50,
      uploadMbps: 50,
      monthlyPrice: 4000,
      setupFee: 0,
      features: [
        'Dedicated Bandwidth',
        '100% Speed Consistency',
        'Fiber Optic Connection',
        'Multiple Upstream',
        'Redundancy: Yes',
        'Priority Tech Support',
        'Digital Payment System',
        '24/7 Call Center',
      ],
      sortOrder: 110,
    },
    {
      name: 'SME — Economy (100 Mbps)',
      code: 'DESH-SME-ECONOMY',
      category: 'corporate' as const,
      tagline: '100 Mbps — call for price',
      description:
        'Ideal for offices — dedicated 100 Mbps bandwidth with free LAN setup. ' +
        'Price on application — contact our sales team for a custom quote.',
      imageUrl: IMG.smeEconomy,
      downloadMbps: 100,
      uploadMbps: 100,
      monthlyPrice: 0,
      setupFee: 0,
      features: [
        'Ideal for offices',
        'Dedicated bandwidth',
        'Free LAN setup',
        'Fiber Optic Connection',
        'Multiple Upstream',
        'Redundancy: Yes',
        'Priority Tech Support',
        '24/7 Call Center',
      ],
      sortOrder: 120,
    },

    // --- Gaming tier ---------------------------------------------------------
    {
      name: 'GAME STARTER',
      code: 'DESH-GAME-STARTER',
      category: 'gaming' as const,
      tagline: 'Up to 40 Mbps with low-latency gaming network',
      description: 'Up to 40 Mbps with up to 70% speed consistency on our low-latency gaming network.',
      imageUrl: IMG.gameStarter,
      downloadMbps: 40,
      uploadMbps: 40,
      monthlyPrice: 1260,
      setupFee: 0,
      features: [
        'Speed: Up to 40 Mbps',
        'Up to 70% Speed Consistency',
        'IPv6 Public IP',
        'Lag-free Gaming Network',
        'Low Latency Gaming Network',
        'Shared Gaming Cache Server',
        '4K YouTube and Facebook',
        'Optical Fiber Connection',
      ],
      sortOrder: 130,
    },
    {
      name: 'GAME PRO',
      code: 'DESH-GAME-PRO',
      category: 'gaming' as const,
      tagline: 'Exclusive bandwidth for competitive gamers',
      description: 'Exclusive bandwidth privileges, dedicated gaming cache, and up to 90% speed consistency.',
      imageUrl: IMG.gamePro,
      downloadMbps: 60,
      uploadMbps: 60,
      monthlyPrice: 1575,
      setupFee: 0,
      features: [
        'Exclusive Bandwidth Privileges',
        'Up to 90% Speed Consistency',
        'IPv6 Public IP',
        'Lag-free Gaming Network',
        'Low Latency Gaming Network',
        'Dedicated Gaming Cache Server',
        '4K YouTube and Facebook',
        'Optical Fiber Connection',
      ],
      isFeatured: true,
      sortOrder: 140,
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
    {
      name: 'Mohammadpur',
      code: 'MPR',
      city: 'Dhaka',
      description: 'Head-end zone — Mohammadia Housing Society, Shankar, Tajmahal Road',
    },
    { name: 'Dhanmondi', code: 'DHN', city: 'Dhaka', description: 'Dhanmondi 1 to 32, Jigatola' },
    { name: 'Adabor', code: 'ADB', city: 'Dhaka', description: 'Adabor, Shyamoli, Ring Road' },
    { name: 'Mirpur', code: 'MIR', city: 'Dhaka', description: 'Mirpur 1 to Mirpur 14' },
    { name: 'Lalmatia', code: 'LAL', city: 'Dhaka', description: 'Lalmatia A, B, C, D block' },
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
        notes: 'Interested in Comfort (50 Mbps) personal plan',
      },
      {
        name: 'Green Cafe',
        phone: '+8801700000002',
        address: 'Mohammadpur Bus Stand, Dhaka',
        status: 'contacted',
        source: 'walkin',
        notes: 'Asked about SME-Elite corporate plan with static IP',
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
      host: 'cinema.desh.bdix',
      webUrl: 'http://cinema.desh.bdix',
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
      host: 'mirror.desh.bdix',
      webUrl: 'http://mirror.desh.bdix',
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
      host: 'xchg.deshcommunications.net',
      webUrl: 'https://xchg.deshcommunications.net',
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
      host: 'vault.deshcommunications.net',
      webUrl: 'https://vault.deshcommunications.net',
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
      host: 'partner.deshcommunications.net',
      webUrl: 'https://partner.deshcommunications.net',
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
      host: 'edu.deshcommunications.net',
      webUrl: 'https://edu.deshcommunications.net',
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
