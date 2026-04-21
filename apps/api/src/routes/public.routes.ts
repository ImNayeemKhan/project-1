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
