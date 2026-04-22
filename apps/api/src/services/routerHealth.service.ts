import { Router as RouterModel } from '../models/Router';
import { Ticket } from '../models/Ticket';
import { User } from '../models/User';
import { mikrotikService } from './mikrotik.service';
import { logger } from '../config/logger';
import { emitWebhook } from './webhook.service';
import { sendEmail, templates } from './notification.service';
import { randomToken } from '../utils/crypto';

/**
 * Polls every active Router document via the MikroTik adapter. On first
 * failure we auto-create a NOC ticket (so the on-call sees it in the normal
 * admin queue), page any admin via email, and fire a router.down webhook.
 * On recovery we close the auto-ticket and fire router.up.
 *
 * Creates at most one open NOC ticket per router by encoding the router id
 * in the ticket subject prefix and matching on it.
 */

const NOC_PREFIX = '[NOC]';
const NOC_SUBJECT = (name: string) => `${NOC_PREFIX} Router ${name} unreachable`;

async function ensureNocActor(): Promise<{ _id: any; email: string; name: string }> {
  // NOC tickets are attributed to the first admin user. In larger deployments
  // you'd have a dedicated "system" user here.
  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }).select('name email');
  if (admin) return admin as any;
  throw new Error('No admin user present to attribute NOC ticket to');
}

function ticketNo(): string {
  return 'NOC-' + Date.now().toString(36).toUpperCase() + randomToken(3).toUpperCase();
}

export const routerHealthService = {
  async pollAll(): Promise<{ checked: number; down: number; recovered: number }> {
    const routers = await RouterModel.find({ isActive: true });
    let down = 0;
    let recovered = 0;

    for (const router of routers) {
      const result = await mikrotikService.ping(router);
      const wasDown = !!router.lastSeenAt && router.lastSeenAt.getTime() === 0; // never-seen flag
      const previouslyOk = !!router.lastSeenAt && router.lastSeenAt.getTime() > 0;

      if (result.ok) {
        router.lastSeenAt = new Date();
        await router.save();
        // Recovery: close any open NOC ticket for this router and emit up.
        const open = await Ticket.findOne({
          subject: NOC_SUBJECT(router.name),
          status: { $in: ['open', 'pending'] },
        });
        if (open) {
          open.status = 'resolved';
          open.lastActivityAt = new Date();
          open.messages.push({
            author: open.customer,
            authorRole: 'admin',
            body: `Auto-closed by NOC poller. Latency ${result.latencyMs}ms.`,
            createdAt: new Date(),
          } as any);
          await open.save();
          recovered++;
          await emitWebhook('router.up', {
            routerId: String(router._id),
            name: router.name,
            host: router.host,
            latencyMs: result.latencyMs,
          }).catch(() => undefined);
        }
        continue;
      }

      // Down path — ensure a single open NOC ticket exists.
      down++;
      const existing = await Ticket.findOne({
        subject: NOC_SUBJECT(router.name),
        status: { $in: ['open', 'pending'] },
      });
      if (!existing) {
        try {
          const actor = await ensureNocActor();
          await Ticket.create({
            ticketNo: ticketNo(),
            customer: actor._id,
            subject: NOC_SUBJECT(router.name),
            category: 'connection',
            priority: 'urgent',
            status: 'open',
            messages: [
              {
                author: actor._id,
                authorRole: 'admin',
                body: `Router ${router.name} (${router.host}) failed health check. Error: ${
                  result.error ?? 'unknown'
                }.`,
                createdAt: new Date(),
              },
            ],
            lastActivityAt: new Date(),
          });

          const tmpl = templates.routerDown({
            name: router.name,
            host: router.host,
            lastSeen: router.lastSeenAt,
          });
          await sendEmail({
            to: actor.email,
            toName: actor.name,
            subject: tmpl.subject,
            text: tmpl.text,
            tags: ['noc', 'router-down'],
          });
          await emitWebhook('router.down', {
            routerId: String(router._id),
            name: router.name,
            host: router.host,
            error: result.error,
          }).catch(() => undefined);
        } catch (err) {
          logger.error('NOC ticket creation failed', {
            router: router.name,
            err: (err as Error).message,
          });
        }
      }
      // Flag: keep lastSeenAt at its previous value so we can tell "never up"
      // from "was up before". Do not overwrite on failure.
      void previouslyOk;
      void wasDown;
    }

    logger.info('Router health poll complete', { checked: routers.length, down, recovered });
    return { checked: routers.length, down, recovered };
  },
};
