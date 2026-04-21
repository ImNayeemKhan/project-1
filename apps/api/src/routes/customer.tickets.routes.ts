import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Ticket } from '../models/Ticket';
import { NotFound } from '../utils/errors';
import { emitWebhook } from '../services/webhook.service';

export const customerTicketsRouter = Router();
customerTicketsRouter.use(requireAuth, requireRole('customer'));

customerTicketsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await Ticket.find({ customer: req.auth!.userId }).sort({ lastActivityAt: -1 }).limit(100);
    res.json({ items });
  })
);

customerTicketsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findOne({ _id: req.params.id, customer: req.auth!.userId }).populate(
      'messages.author',
      'name role'
    );
    if (!ticket) throw NotFound('Ticket not found');
    res.json({ ticket });
  })
);

const createSchema = z.object({
  subject: z.string().min(3).max(200),
  category: z
    .enum(['connection', 'billing', 'installation', 'upgrade', 'cancellation', 'other'])
    .default('other'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  body: z.string().min(1).max(4000),
});

customerTicketsRouter.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    // `Date.now()` alone collides when two customers hit Submit in the same
    // ms — with a unique index on ticketNo, one request fails with a 500 and
    // the customer sees a broken UI. Append 6 hex chars (24 bits of entropy)
    // matching how routerHealth.service.ts generates NOC tickets.
    const ticketNo = `TKT-${Date.now().toString(36).toUpperCase()}${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;
    const ticket = await Ticket.create({
      ticketNo,
      customer: req.auth!.userId,
      subject: req.body.subject,
      category: req.body.category,
      priority: req.body.priority,
      status: 'open',
      lastActivityAt: new Date(),
      messages: [
        {
          author: req.auth!.userId,
          authorRole: 'customer',
          body: req.body.body,
          createdAt: new Date(),
        },
      ],
    });
    await emitWebhook('ticket.opened', {
      ticketId: String(ticket._id),
      ticketNo: ticket.ticketNo,
      customerId: String(req.auth!.userId),
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
    }).catch(() => undefined);
    res.status(201).json({ ticket });
  })
);

const replySchema = z.object({ body: z.string().min(1).max(4000) });

customerTicketsRouter.post(
  '/:id/reply',
  validate(replySchema),
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findOne({ _id: req.params.id, customer: req.auth!.userId });
    if (!ticket) throw NotFound('Ticket not found');
    ticket.messages.push({
      author: new Types.ObjectId(req.auth!.userId),
      authorRole: 'customer',
      body: req.body.body,
      createdAt: new Date(),
    });
    ticket.status = 'open';
    ticket.lastActivityAt = new Date();
    // Fresh customer activity: clear the SLA-escalated flag so the sweep
    // can re-evaluate on the new timer instead of assuming this ticket was
    // already escalated.
    (ticket as any).slaEscalated = false;
    await ticket.save();
    res.json({ ticket });
  })
);
