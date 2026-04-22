import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { Ticket } from '../models/Ticket';
import { NotFound } from '../utils/errors';
import { emitWebhook } from '../services/webhook.service';

export const adminTicketsRouter = Router();
adminTicketsRouter.use(requireAuth, requireRole('admin'));

adminTicketsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, priority, assignedTo } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    const items = await Ticket.find(filter)
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort({ lastActivityAt: -1 })
      .limit(200);
    res.json({ items });
  })
);

adminTicketsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('messages.author', 'name role');
    if (!ticket) throw NotFound('Ticket not found');
    res.json({ ticket });
  })
);

const replySchema = z.object({ body: z.string().min(1) });

adminTicketsRouter.post(
  '/:id/reply',
  validate(replySchema),
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) throw NotFound('Ticket not found');
    ticket.messages.push({
      author: new Types.ObjectId(req.auth!.userId),
      authorRole: req.auth!.role as 'admin' | 'reseller',
      body: req.body.body,
      createdAt: new Date(),
    });
    ticket.status = 'pending';
    ticket.lastActivityAt = new Date();
    // Admin replied — reset SLA timer flag.
    (ticket as any).slaEscalated = false;
    await ticket.save();
    res.json({ ticket });
  })
);

const actionSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
});

adminTicketsRouter.patch(
  '/:id',
  validate(actionSchema),
  asyncHandler(async (req, res) => {
    const existing = await Ticket.findById(req.params.id);
    if (!existing) throw NotFound('Ticket not found');
    const wasResolved = existing.status === 'resolved' || existing.status === 'closed';
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastActivityAt: new Date() },
      { new: true }
    );
    if (!ticket) throw NotFound('Ticket not found');
    if (
      req.body.status &&
      (req.body.status === 'resolved' || req.body.status === 'closed') &&
      !wasResolved
    ) {
      await emitWebhook('ticket.resolved', {
        ticketId: String(ticket._id),
        ticketNo: ticket.ticketNo,
        customerId: String(ticket.customer),
        status: ticket.status,
      }).catch(() => undefined);
    }
    res.json({ ticket });
  })
);
