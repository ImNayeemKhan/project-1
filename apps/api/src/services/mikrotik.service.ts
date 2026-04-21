import { env } from '../config/env';
import { logger } from '../config/logger';
import { decrypt } from '../utils/crypto';
import type { IRouter } from '../models/Router';

/**
 * MikroTik RouterOS API adapter.
 *
 * In production, connects via the RouterOS API (TCP 8728, or 8729 for TLS) using
 * the `node-routeros` package. When MIKROTIK_ENABLED=false or no router is bound
 * to a subscription, the adapter runs in "dry-run" mode: it logs the intended
 * operation and returns a successful stub result. This lets the billing/provisioning
 * logic be exercised fully in staging before pointing at real hardware.
 *
 * Swap in real credentials via the Router document or the MIKROTIK_* env vars and
 * set MIKROTIK_ENABLED=true.
 */

export interface PppoeUser {
  username: string;
  password: string;
  profile: string;
  comment?: string;
}

export interface MikrotikConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
}

function resolveConnection(router?: IRouter | null): MikrotikConnection | null {
  if (router) {
    return {
      host: router.host,
      port: router.port,
      user: router.username,
      password: decrypt(router.passwordEncrypted),
      tls: router.tls,
    };
  }
  if (!env.MIKROTIK_ENABLED) return null;
  return {
    host: env.MIKROTIK_HOST,
    port: env.MIKROTIK_PORT,
    user: env.MIKROTIK_USER,
    password: env.MIKROTIK_PASSWORD,
    tls: env.MIKROTIK_TLS,
  };
}

async function withClient<T>(
  conn: MikrotikConnection,
  fn: (client: any) => Promise<T>
): Promise<T> {
  // Lazy-require so the native dep is only loaded when a real router is bound.
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { RouterOSAPI } = require('node-routeros');
  const client = new RouterOSAPI({
    host: conn.host,
    port: conn.port,
    user: conn.user,
    password: conn.password,
    tls: conn.tls ? {} : undefined,
    timeout: 10,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
  }
}

export const mikrotikService = {
  async addPppoeUser(user: PppoeUser, router?: IRouter | null): Promise<{ dryRun: boolean }> {
    const conn = resolveConnection(router);
    if (!conn) {
      logger.info('[mikrotik:dry-run] addPppoeUser', { username: user.username, profile: user.profile });
      return { dryRun: true };
    }
    await withClient(conn, async (client) => {
      await client.write('/ppp/secret/add', [
        `=name=${user.username}`,
        `=password=${user.password}`,
        `=service=pppoe`,
        `=profile=${user.profile}`,
        ...(user.comment ? [`=comment=${user.comment}`] : []),
      ]);
    });
    return { dryRun: false };
  },

  async setPppoeEnabled(username: string, enabled: boolean, router?: IRouter | null): Promise<{ dryRun: boolean }> {
    const conn = resolveConnection(router);
    if (!conn) {
      logger.info('[mikrotik:dry-run] setPppoeEnabled', { username, enabled });
      return { dryRun: true };
    }
    await withClient(conn, async (client) => {
      const found = await client.write('/ppp/secret/print', [`?name=${username}`]);
      if (!Array.isArray(found) || found.length === 0) {
        throw new Error(`PPPoE user not found: ${username}`);
      }
      const id = found[0]['.id'];
      await client.write('/ppp/secret/set', [`=.id=${id}`, `=disabled=${enabled ? 'no' : 'yes'}`]);
      if (!enabled) {
        // Kick the session if currently active.
        const active = await client.write('/ppp/active/print', [`?name=${username}`]);
        if (Array.isArray(active) && active.length > 0) {
          await client.write('/ppp/active/remove', [`=.id=${active[0]['.id']}`]);
        }
      }
    });
    return { dryRun: false };
  },

  async removePppoeUser(username: string, router?: IRouter | null): Promise<{ dryRun: boolean }> {
    const conn = resolveConnection(router);
    if (!conn) {
      logger.info('[mikrotik:dry-run] removePppoeUser', { username });
      return { dryRun: true };
    }
    await withClient(conn, async (client) => {
      const found = await client.write('/ppp/secret/print', [`?name=${username}`]);
      if (Array.isArray(found) && found.length > 0) {
        await client.write('/ppp/secret/remove', [`=.id=${found[0]['.id']}`]);
      }
    });
    return { dryRun: false };
  },

  async listActiveSessions(router?: IRouter | null): Promise<any[]> {
    const conn = resolveConnection(router);
    if (!conn) {
      logger.info('[mikrotik:dry-run] listActiveSessions');
      return [];
    }
    return withClient(conn, async (client) => client.write('/ppp/active/print'));
  },
};
