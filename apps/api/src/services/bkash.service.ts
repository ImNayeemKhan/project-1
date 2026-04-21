import { env } from '../config/env';
import { logger } from '../config/logger';
import { randomToken } from '../utils/crypto';

/**
 * bKash Tokenized Checkout — structured like the real flow so swapping the
 * mock for live HTTP calls is a config change.
 *
 * Real flow:
 *   1. POST /tokenized/checkout/token/grant          → id_token
 *   2. POST /tokenized/checkout/create               → paymentID + bkashURL
 *   3. customer approves on bkashURL
 *   4. POST /tokenized/checkout/execute              → transactionID
 *   5. callback hits our server with paymentID
 *
 * In mock mode we simulate step 1-3 and return a fake approval URL that routes
 * back to our own callback, so the end-to-end UX works for demos.
 */

export interface CreatePaymentArgs {
  amount: number;
  currency?: string;
  invoiceId: string;
  payerReference?: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  bkashURL: string;
  amount: number;
  currency: string;
}

export interface ExecuteResult {
  paymentId: string;
  trxId: string;
  status: 'Completed' | 'Failed';
  amount: number;
}

async function grantToken(): Promise<string> {
  if (env.BKASH_MODE === 'mock') return 'MOCK_TOKEN_' + randomToken(8);
  // Real implementation would call:
  //   POST ${BASE_URL}/tokenized/checkout/token/grant
  //   headers: { username, password }
  //   body: { app_key, app_secret }
  // and return id_token.
  throw new Error('bKash live mode is not wired up. Provide real credentials and implement grantToken().');
}

export const bkashService = {
  mode: env.BKASH_MODE,

  async createPayment(args: CreatePaymentArgs): Promise<CreatePaymentResult> {
    await grantToken();
    const paymentId = 'BKH' + Date.now().toString(36).toUpperCase() + randomToken(4).toUpperCase();

    if (env.BKASH_MODE === 'mock') {
      // Mock URL points right at our callback — the customer clicks through and
      // we immediately mark it paid for demos.
      const callback = new URL(env.BKASH_CALLBACK_URL);
      callback.searchParams.set('paymentID', paymentId);
      callback.searchParams.set('status', 'success');
      callback.searchParams.set('mock', '1');
      logger.info('[bkash:mock] createPayment', { paymentId, amount: args.amount, invoiceId: args.invoiceId });
      return {
        paymentId,
        bkashURL: callback.toString(),
        amount: args.amount,
        currency: args.currency ?? 'BDT',
      };
    }

    throw new Error('bKash live mode is not wired up.');
  },

  async executePayment(paymentId: string, expectedAmount: number): Promise<ExecuteResult> {
    if (env.BKASH_MODE === 'mock') {
      return {
        paymentId,
        trxId: 'MOCK' + randomToken(6).toUpperCase(),
        status: 'Completed',
        amount: expectedAmount,
      };
    }
    throw new Error('bKash live mode is not wired up.');
  },
};
