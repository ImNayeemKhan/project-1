import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { FtpServer } from '../models/FtpServer';
import { Conflict, NotFound } from '../utils/errors';

export const adminFtpRouter = Router();
adminFtpRouter.use(requireAuth, requireRole('admin'));

adminFtpRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await FtpServer.find().sort({ category: 1, sortOrder: 1, name: 1 });
    res.json({ items });
  })
);

const upsertSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.enum(['entertainment', 'carrier', 'business', 'partnership']),
  tagline: z.string().optional(),
  description: z.string().optional(),
  host: z.string().min(1),
  webUrl: z.string().url().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  protocol: z.enum(['ftp', 'http', 'https', 'smb']).optional(),
  accessLevel: z.enum(['public', 'customer', 'business', 'partner']).optional(),
  capacityTB: z.number().min(0).optional(),
  maxSpeedMbps: z.number().min(0).optional(),
  contentTypes: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

adminFtpRouter.post(
  '/',
  validate(upsertSchema),
  asyncHandler(async (req, res) => {
    const code = req.body.code.toUpperCase();
    const exists = await FtpServer.findOne({ code });
    if (exists) throw Conflict('FTP server code already exists');
    const server = await FtpServer.create({ ...req.body, code });
    res.status(201).json({ server });
  })
);

adminFtpRouter.patch(
  '/:id',
  validate(upsertSchema.partial()),
  asyncHandler(async (req, res) => {
    const update = { ...req.body };
    if (update.code) update.code = update.code.toUpperCase();
    const server = await FtpServer.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!server) throw NotFound('FTP server not found');
    res.json({ server });
  })
);

adminFtpRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const server = await FtpServer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!server) throw NotFound('FTP server not found');
    res.json({ ok: true });
  })
);
