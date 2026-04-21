import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { User } from '../models/User';
import { Zone } from '../models/Zone';
import { AuditLog } from '../models/AuditLog';
import { env } from '../config/env';
import { BadRequest } from '../utils/errors';

export const adminBulkImportRouter = Router();
adminBulkImportRouter.use(requireAuth, requireRole('admin'));

/**
 * Minimal RFC-4180-ish CSV parser.
 *
 * Handles quoted cells, escaped quotes (""), and CRLF / LF newlines.
 * No stream support — bulk import is expected to be "small" (a few thousand
 * rows). For anything larger, we'd swap in csv-parse; for now this keeps
 * the dependency surface small.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim().length > 0));
}

const bodySchema = z.object({
  csv: z.string().min(10).max(5 * 1024 * 1024), // 5 MB raw text cap
  dryRun: z.boolean().default(false),
});

adminBulkImportRouter.post(
  '/customers',
  validate(bodySchema),
  asyncHandler(async (req, res) => {
    const rows = parseCsv(req.body.csv);
    if (rows.length < 2) throw BadRequest('CSV must have a header row and at least one data row.');

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const required = ['name', 'email'];
    for (const r of required) {
      if (!header.includes(r)) throw BadRequest(`Missing required column: ${r}`);
    }
    const idx = (name: string) => header.indexOf(name);

    // Cache zones by name for fast lookups without hitting mongo per row.
    const zoneByName = new Map<string, string>();
    const zones = await Zone.find().select('name').lean();
    for (const z of zones) zoneByName.set(z.name.toLowerCase(), String(z._id));

    const results = {
      total: rows.length - 1,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; email?: string; error: string }>,
    };

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const email = (cols[idx('email')] ?? '').trim().toLowerCase();
      const name = (cols[idx('name')] ?? '').trim();
      if (!email || !name) {
        results.skipped++;
        results.errors.push({ row: i + 1, error: 'Missing name or email' });
        continue;
      }
      try {
        const phone = idx('phone') >= 0 ? cols[idx('phone')]?.trim() : undefined;
        const address = idx('address') >= 0 ? cols[idx('address')]?.trim() : undefined;
        const nid = idx('nid') >= 0 ? cols[idx('nid')]?.trim() : undefined;
        const zoneName = idx('zone') >= 0 ? cols[idx('zone')]?.trim().toLowerCase() : undefined;
        const zone = zoneName ? zoneByName.get(zoneName) : undefined;

        if (req.body.dryRun) {
          const exists = await User.exists({ email });
          if (exists) {
            results.updated++;
          } else {
            results.created++;
          }
          continue;
        }

        const existing = await User.findOne({ email });
        if (existing) {
          existing.name = name || existing.name;
          if (phone) existing.phone = phone;
          if (address) existing.address = address;
          if (nid) existing.nid = nid;
          if (zone) existing.zone = zone as never;
          await existing.save();
          results.updated++;
        } else {
          // For bulk-created customers we generate a random password and
          // rely on the admin to run "send password-reset" later. Never
          // expose the generated password — it's throwaway. Real deployments
          // should email a password-set link instead.
          // Cryptographically strong throwaway password. `Math.random()` is
          // a predictable PRNG whose output an attacker who knows the
          // approximate timestamp could reconstruct — meaningful here
          // because the admin never sees the password (we expect them to
          // trigger a password-reset flow to the customer), but a window
          // still exists between creation and reset.
          const tempPassword = crypto.randomBytes(12).toString('base64url');
          const passwordHash = await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS);
          await User.create({
            email,
            name,
            phone,
            address,
            nid,
            zone,
            role: 'customer',
            passwordHash,
          });
          results.created++;
        }
      } catch (err) {
        results.errors.push({
          row: i + 1,
          email,
          error: (err as Error).message,
        });
      }
    }

    if (!req.body.dryRun) {
      await AuditLog.create({
        actor: req.auth!.userId,
        actorRole: req.auth!.role,
        action: 'bulk_import.customers',
        target: 'customers',
        meta: {
          total: results.total,
          created: results.created,
          updated: results.updated,
          errors: results.errors.length,
        },
      });
    }

    res.json(results);
  })
);
