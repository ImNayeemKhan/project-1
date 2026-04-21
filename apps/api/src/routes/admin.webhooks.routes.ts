import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  WebhookSubscription,
  WEBHOOK_EVENTS,
  WebhookEventType,
} from '../models/WebhookSubscription';
import { WebhookDelivery } from '../models/WebhookDelivery';
import { generateWebhookSecret } from '../services/webhook.service';
import { NotFound } from '../utils/errors';

export const adminWebhooksRouter = Router();
adminWebhooksRouter.use(requireAuth, requireRole('admin'));

adminWebhooksRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await WebhookSubscription.find().sort({ createdAt: -1 });
    res.json({ items, events: WEBHOOK_EVENTS });
  })
);

const createSchema = z.object({
  name: z.string().min(2).max(100),
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS as unknown as [WebhookEventType, ...WebhookEventType[]])).min(1),
  isActive: z.boolean().default(true),
});

adminWebhooksRouter.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const sub = await WebhookSubscription.create({
      ...req.body,
      secret: generateWebhookSecret(),
      createdBy: req.auth!.userId,
      failureCount: 0,
    });
    res.status(201).json({ subscription: sub });
  })
);

const updateSchema = createSchema.partial();

adminWebhooksRouter.patch(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const sub = await WebhookSubscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sub) throw NotFound('Webhook subscription not found');
    res.json({ subscription: sub });
  })
);

adminWebhooksRouter.post(
  '/:id/rotate-secret',
  asyncHandler(async (req, res) => {
    const sub = await WebhookSubscription.findById(req.params.id);
    if (!sub) throw NotFound('Webhook subscription not found');
    sub.secret = generateWebhookSecret();
    sub.failureCount = 0;
    await sub.save();
    res.json({ subscription: sub });
  })
);

adminWebhooksRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const sub = await WebhookSubscription.findByIdAndDelete(req.params.id);
    if (!sub) throw NotFound('Webhook subscription not found');
    res.json({ ok: true });
  })
);

adminWebhooksRouter.get(
  '/:id/deliveries',
  asyncHandler(async (req, res) => {
    const items = await WebhookDelivery.find({ subscription: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ items });
  })
);
