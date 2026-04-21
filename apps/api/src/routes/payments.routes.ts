import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { bkashService } from '../services/bkash.service';
import { billingService } from '../services/billing.service';
import { BadRequest, NotFound } from '../utils/errors';

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
    if (invoice.status === 'paid') throw BadRequest('Invoice already paid');

    const result = await bkashService.createPayment({
      amount: invoice.amount,
      currency: invoice.currency,
      invoiceId: String(invoice._id),
      payerReference: req.auth!.email,
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
    payment.status = executed.status === 'Completed' ? 'success' : 'failed';
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
