import crypto from 'node:crypto';
import { logger } from '../config/logger';
import {
  WebhookSubscription,
  WebhookEventType,
} from '../models/WebhookSubscription';
import { WebhookDelivery } from '../models/WebhookDelivery';

/**
 * Fan out a domain event to every active webhook subscription that has
 * registered for it. Each delivery is persisted with its status + attempts
 * so the admin /health page can surface flapping endpoints.
 *
 * Signature scheme: HMAC-SHA256 of the raw JSON body using the subscription's
 * stored secret, sent in the `X-Webhook-Signature` header. Receivers should
 * verify with the same secret.
 */

export interface EmitOptions {
  timeoutMs?: number;
}

export async function emitWebhook(
  event: WebhookEventType,
  payload: Record<string, unknown>,
  opts: EmitOptions = {}
): Promise<void> {
  const subs = await WebhookSubscription.find({
    isActive: true,
    events: event,
  });
  if (!subs.length) return;

  const timeout = opts.timeoutMs ?? 8000;
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  await Promise.all(
    subs.map(async (sub) => {
      const delivery = await WebhookDelivery.create({
        subscription: sub._id,
        event,
        payload: { event, data: payload },
        status: 'pending',
        attempts: 0,
      });

      try {
        const signature = crypto
          .createHmac('sha256', sub.secret)
          .update(body)
          .digest('hex');

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        let status = 0;
        try {
          const res = await fetch(sub.url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'user-agent': 'DeshCommunications-Webhook/1.0',
              'x-webhook-event': event,
              'x-webhook-signature': `sha256=${signature}`,
              'x-webhook-delivery': String(delivery._id),
            },
            body,
            signal: controller.signal,
          });
          status = res.status;
        } finally {
          clearTimeout(timer);
        }

        delivery.attempts += 1;
        delivery.httpStatus = status;
        delivery.deliveredAt = new Date();
        if (status >= 200 && status < 300) {
          delivery.status = 'success';
          sub.failureCount = 0;
        } else {
          delivery.status = 'failed';
          delivery.lastError = `HTTP ${status}`;
          sub.failureCount = (sub.failureCount ?? 0) + 1;
        }
        sub.lastDeliveryAt = new Date();
        sub.lastStatus = status;
        await Promise.all([delivery.save(), sub.save()]);
      } catch (err) {
        delivery.attempts += 1;
        delivery.status = 'failed';
        delivery.lastError = (err as Error).message;
        delivery.deliveredAt = new Date();
        await delivery.save();
        sub.failureCount = (sub.failureCount ?? 0) + 1;
        sub.lastDeliveryAt = new Date();
        await sub.save();
        logger.warn('Webhook delivery failed', {
          sub: String(sub._id),
          event,
          err: (err as Error).message,
        });
      }
    })
  );
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(24).toString('hex');
}
