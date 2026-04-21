import dgram from 'dgram';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * RADIUS integration layer.
 *
 * Primary job: send Change-of-Authorization (CoA) or Disconnect-Request packets
 * to a FreeRADIUS server when a subscription is suspended/resumed. The `radius`
 * npm package handles packet encoding/decoding using a dictionary.
 *
 * When RADIUS_ENABLED=false this is a no-op that logs intent — swap on when your
 * FreeRADIUS server is live.
 */

export interface CoARequest {
  username: string;
  action: 'disconnect' | 'reauthorize';
}

export const radiusService = {
  async sendCoA(req: CoARequest): Promise<{ dryRun: boolean }> {
    if (!env.RADIUS_ENABLED) {
      logger.info('[radius:dry-run] sendCoA', req);
      return { dryRun: true };
    }

    // Lazy-require so the dict parser only loads when RADIUS is actually enabled.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const radius = require('radius');

    const packet = radius.encode({
      code: req.action === 'disconnect' ? 'Disconnect-Request' : 'CoA-Request',
      secret: env.RADIUS_SECRET,
      attributes: [['User-Name', req.username]],
    });

    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket('udp4');
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error('RADIUS CoA timeout'));
      }, 5000);

      socket.on('message', (msg) => {
        clearTimeout(timeout);
        try {
          const response = radius.decode({ packet: msg, secret: env.RADIUS_SECRET });
          logger.info('RADIUS CoA response', { code: response.code, username: req.username });
          resolve({ dryRun: false });
        } catch (err) {
          reject(err);
        } finally {
          socket.close();
        }
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        socket.close();
        reject(err);
      });

      // CoA / Disconnect requests go to RFC 5176's dedicated port (3799 by
      // default via RADIUS_COA_PORT) — not the auth/acct ports, which would
      // silently drop these packet types.
      socket.send(packet, 0, packet.length, env.RADIUS_COA_PORT, env.RADIUS_HOST);
    });
  },
};
