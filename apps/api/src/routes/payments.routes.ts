import { Router, RequestHandler } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { bkashService } from '../services/bkash.service';
import { billingService } from '../services/billing.service';
import { env } from '../config/env';
import { BadRequest, Conflict, NotFound, Unauthorized } from '../utils/errors';

// If a previous /bkash/init for the same invoice is still pending, we treat
// the checkout as in-flight for this long before letting a retry start a
// fresh session. Covers the common "user clicked Pay twice / hit refresh"
// case without stranding them behind a permanently-stuck payment row if
// bKash never actually completes the first one.
const PENDING_PAYMENT_REUSE_WINDOW_MS = 10 * 60 * 1000;

// Deterministic HMAC binding a bKash callback URL to a specific paymentID.
// Prevents an unauthenticated attacker who guesses/enumerates a pending
// `gatewayPaymentId` from forging `status=success` callbacks and settling
// invoices they don't own. In real bKash production the gateway signs its
// POSTs so verification lives in `bkashService.verifySignature()`; in mock
// mode we sign our own redirect URL here.
function signCallback(paymentId: string): string {
  return crypto
    .createHmac('sha256', env.JWT_ACCESS_SECRET)
    .update(paymentId)
    .digest('hex')
    .slice(0, 32);
}

export function verifyCallbackSignature(paymentId: string, sig: string): boolean {
  const expected = signCallback(paymentId);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function buildPaymentsRouter(paymentLimiter: RequestHandler) {
  const paymentsRouter = Router();

// --- Initiate bKash payment ---
paymentsRouter.post(
  '/bkash/init',
  requireAuth,
  paymentLimiter,
  validate(z.object({ invoiceId: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ _id: req.body.invoiceId, customer: req.auth!.userId });
    if (!invoice) throw NotFound('Invoice not found');
    // Block both terminal statuses. Without the void check, an admin could
    // cancel an invoice while a customer is mid-checkout and still take
    // money that then can't be reconciled against any open obligation.
    if (invoice.status === 'paid') throw BadRequest('Invoice already paid');
    if (invoice.status === 'void') throw BadRequest('Invoice has been voided');

    // Double-charge guard. Without this, a customer clicking "Pay" twice (or
    // retrying after a network blip) would create two independent bKash
    // sessions with different gatewayPaymentId values. Both can complete,
    // charging the customer twice while only one settles the invoice.
    // A recent pending payment is treated as in-flight; older ones are
    // considered abandoned and a fresh session is allowed to start.
    const existingPending = await Payment.findOne({
      invoice: invoice._id,
      status: 'pending',
      createdAt: { $gt: new Date(Date.now() - PENDING_PAYMENT_REUSE_WINDOW_MS) },
    }).sort({ createdAt: -1 });
    if (existingPending) {
      throw Conflict('A payment is already in progress for this invoice. Please complete the bKash checkout from the previous attempt, or try again in a few minutes.');
    }

    const result = await bkashService.createPayment({
      amount: invoice.amount,
      currency: invoice.currency,
      invoiceId: String(invoice._id),
      payerReference: req.auth!.email,
      callbackSignature: signCallback,
    });

    await Payment.create({
      invoice: invoice._id,
      customer: invoice.customer,
      gateway: 'bkash',
      amount: invoice.amount,
      currency: invoice.currency,
      gatewayPaymentId: result.paymentId,
      status: 'pending',
    });

    res.json(result);
  })
);

// --- Callback from bKash (or from our mock URL) ---
// In production, bKash POSTs to this endpoint; in mock mode the user is redirected
// here via GET and we short-circuit to success.
paymentsRouter.all(
  '/bkash/callback',
  asyncHandler(async (req, res) => {
    const paymentId = (req.query.paymentID as string) || (req.body?.paymentID as string);
    // Absence of status must be treated as failure — never defaulted to success — so an
    // unauthenticated GET to /api/payments/bkash/callback?paymentID=<id> can't forge a
    // completion. In production bKash always posts `status`; in mock mode our own redirect
    // URL appends `status=success` explicitly on happy path.
    const status = (req.query.status as string) || (req.body?.status as string) || '';
    if (!paymentId) throw BadRequest('Missing paymentID');

    // Signature verification. In mock mode we signed the redirect URL in
    // `/bkash/init` with an HMAC keyed on JWT_ACCESS_SECRET; the callback
    // must present that exact signature for us to trust `status=success`.
    // In live mode swap this for bKash's real signature header check.
    const sig = (req.query.sig as string) || (req.body?.sig as string) || '';
    if (!sig || !verifyCallbackSignature(paymentId, sig)) {
      throw Unauthorized('Invalid or missing callback signature');
    }

    const payment = await Payment.findOne({ gatewayPaymentId: paymentId });
    if (!payment) throw NotFound('Payment not found');

    // Idempotency guard — a replayed or forged callback must never overwrite
    // a payment that has already reached a terminal state. Redirect based on
    // the stored status and return early.
    if (payment.status !== 'pending') {
      return res.redirect(
        payment.status === 'success'
          ? `/pay/success?tx=${payment.gatewayTxnId ?? ''}`
          : '/pay/failed'
      );
    }

    if (status !== 'success') {
      payment.status = 'failed';
      payment.processedAt = new Date();
      await payment.save();
      return res.redirect('/pay/failed');
    }

    const executed = await bkashService.executePayment(paymentId, payment.amount);
    // Amount sanity-check: the gateway's executed.amount MUST match what we
    // stored on the pending Payment, otherwise a partial / tampered / replayed
    // execute response could settle an invoice for less than owed. Mock mode
    // always echoes expectedAmount, so this is a no-op there.
    const amountMismatch =
      executed.status === 'Completed' && Number(executed.amount) !== Number(payment.amount);
    payment.status = executed.status === 'Completed' && !amountMismatch ? 'success' : 'failed';
    payment.gatewayTxnId = executed.trxId;
    payment.processedAt = new Date();
    payment.rawPayload = executed;
    await payment.save();

    if (payment.status === 'success') {
      await billingService.markInvoicePaid(String(payment.invoice), executed.trxId);
      return res.redirect(`/pay/success?tx=${executed.trxId}`);
    }

    return res.redirect('/pay/failed');
  })
);

  return paymentsRouter;
}
