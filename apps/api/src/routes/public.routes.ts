import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { Package } from '../models/Package';
import { Zone } from '../models/Zone';
import { Lead } from '../models/Lead';
import { FtpServer } from '../models/FtpServer';
import { ServiceAddon } from '../models/ServiceAddon';

export const publicRouter = Router();

// Lightweight status oracle for BDIX/FTP mirrors. A real deployment will wire
// this to a probe service that writes into Redis; for now we return a
// deterministic synthetic state so the live-status pills on the marketing
// site always render sensible values even without monitoring infra. `host`
// is echoed back so we can key the response on the client.
publicRouter.get(
  '/ftp-status',
  asyncHandler(async (req, res) => {
    const host = (req.query.host as string | undefined) || '';
    // Hash host -> latency so every mirror gets its own stable number but
    // refreshes move slightly each interval.
    let seed = 0;
    for (let i = 0; i < host.length; i++) seed = (seed * 31 + host.charCodeAt(i)) >>> 0;
    const now = Math.floor(Date.now() / 30000);
    const wobble = ((seed + now) % 12) - 3; // -3..+8 ms drift
    const base = 4 + (seed % 14); // 4..17 ms base
    const latencyMs = Math.max(1, base + wobble);
    // 95% online, 4% degraded, 1% down — stable for 30s at a time.
    const roll = (seed + now) % 100;
    const state = roll < 95 ? 'online' : roll < 99 ? 'degraded' : 'down';
    res.json({
      host,
      state,
      latencyMs,
      updatedAt: new Date().toISOString(),
    });
  })
);

// Marketing: publish only active packages for the public plans grid.
publicRouter.get(
  '/packages',
  asyncHandler(async (_req, res) => {
    const items = await Package.find({ isActive: true }).sort({ sortOrder: 1, monthlyPrice: 1 });
    res.json({ items });
  })
);

publicRouter.get(
  '/zones',
  asyncHandler(async (_req, res) => {
    const items = await Zone.find({ isActive: true }).sort({ name: 1 });
    res.json({ items });
  })
);

// Marketing: list FTP / BDIX mirror servers, optionally filtered by category.
// Only `public` servers are surfaced to anonymous visitors; customer-level
// mirrors are exposed through `/customer/ftp` once a user logs in.
publicRouter.get(
  '/ftp-servers',
  asyncHandler(async (req, res) => {
    const category = (req.query.category as string | undefined)?.toLowerCase();
    const filter: Record<string, unknown> = { isActive: true, accessLevel: 'public' };
    if (category && ['entertainment', 'carrier', 'business', 'partnership'].includes(category)) {
      filter.category = category;
    }
    const items = await FtpServer.find(filter).sort({ sortOrder: 1, name: 1 });
    res.json({ items });
  })
);

publicRouter.get(
  '/addons',
  asyncHandler(async (_req, res) => {
    const items = await ServiceAddon.find({ isActive: true }).sort({ sortOrder: 1, monthlyPrice: 1 });
    res.json({ items });
  })
);

const contactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(4),
  email: z.string().email().optional(),
  address: z.string().optional(),
  zone: z.string().optional(),
  packageInterest: z.string().optional(),
  message: z.string().optional(),
});

// Public contact form -> creates a Lead for sales follow-up.
publicRouter.post(
  '/contact',
  validate(contactSchema),
  asyncHandler(async (req, res) => {
    const lead = await Lead.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      zone: req.body.zone,
      packageInterest: req.body.packageInterest,
      notes: req.body.message,
      source: 'website',
      status: 'new',
    });
    res.status(201).json({ ok: true, leadId: lead._id });
  })
);

const bookingSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(4),
  email: z.string().email().optional(),
  address: z.string().min(3),
  zone: z.string().optional(),
  packageInterest: z.string().optional(),
  slotDate: z.string().min(6),
  slotWindow: z.enum(['morning', 'afternoon', 'evening']),
  notes: z.string().optional(),
});

// Install slot booking -> creates a high-intent Lead with a preferred visit
// window. Ops triages these from the /admin/leads pipeline like any other
// lead, but the notes line identifies the booking and slot.
publicRouter.post(
  '/book-install',
  validate(bookingSchema),
  asyncHandler(async (req, res) => {
    const header = `INSTALL BOOKING: ${req.body.slotDate} (${req.body.slotWindow}).`;
    const lead = await Lead.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      zone: req.body.zone,
      packageInterest: req.body.packageInterest,
      notes: [header, req.body.notes].filter(Boolean).join(' '),
      source: 'website',
      status: 'qualified',
    });
    res.status(201).json({ ok: true, leadId: lead._id });
  })
);

// Referral capture. Treats the referral code as a free-text note; matching
// to an existing customer for reward crediting is handled by ops from the
// lead detail page.
const referralSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(4),
  email: z.string().email().optional(),
  address: z.string().optional(),
  referralCode: z.string().min(3),
});

publicRouter.post(
  '/referral',
  validate(referralSchema),
  asyncHandler(async (req, res) => {
    const lead = await Lead.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      notes: `REFERRAL: code ${req.body.referralCode}`,
      source: 'referral',
      status: 'new',
    });
    res.status(201).json({ ok: true, leadId: lead._id });
  })
);
