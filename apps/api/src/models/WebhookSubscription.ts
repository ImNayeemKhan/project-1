import { Schema, model, Types } from 'mongoose';

/**
 * External system integration points: an admin (or a partner) can register a
 * URL that we POST JSON events to. Secrets are stored so we can sign the
 * payload with HMAC-SHA256, letting the receiver verify authenticity.
 */

export const WEBHOOK_EVENTS = [
  'payment.succeeded',
  'payment.failed',
  'invoice.created',
  'invoice.paid',
  'invoice.overdue',
  'subscription.created',
  'subscription.suspended',
  'subscription.reactivated',
  'subscription.cancelled',
  'ticket.opened',
  'ticket.escalated',
  'ticket.resolved',
  'router.down',
  'router.up',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

export interface IWebhookSubscription {
  _id: Types.ObjectId;
  name: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  isActive: boolean;
  lastDeliveryAt?: Date;
  lastStatus?: number;
  failureCount: number;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSubscriptionSchema = new Schema<IWebhookSubscription>(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    secret: { type: String, required: true },
    events: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    lastDeliveryAt: { type: Date },
    lastStatus: { type: Number },
    failureCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const WebhookSubscription = model<IWebhookSubscription>(
  'WebhookSubscription',
  WebhookSubscriptionSchema
);
