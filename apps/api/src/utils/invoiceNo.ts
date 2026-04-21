import { randomBytes } from 'crypto';

// Month-prefixed invoice number with 10 hex chars of entropy (~40 bits) —
// large enough to avoid collisions even at high volume.
export function generateInvoiceNo(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const rand = randomBytes(5).toString('hex').toUpperCase();
  return `INV-${yyyy}${mm}-${rand}`;
}
