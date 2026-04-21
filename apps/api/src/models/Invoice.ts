import { Schema, model, Types } from 'mongoose';

export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue' | 'void';

export interface IInvoice {
  _id: Types.ObjectId;
  invoiceNo: string;
  customer: Types.ObjectId;
  subscription: Types.ObjectId;
  amount: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  status: InvoiceStatus;
  paidAt?: Date;
  paymentRef?: string;
  remindersSent?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNo: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'overdue', 'void'],
      default: 'unpaid',
      index: true,
    },
    paidAt: { type: Date },
    paymentRef: { type: String },
    // Dunning bucket markers: 'D1' | 'D3' | 'D7' | 'SUSPENDED'. Used by the
    // dunning scheduler to de-dupe reminders across days and across reruns.
    remindersSent: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Hard guarantee that billing can never create two non-void invoices for
// the same subscription + period, even if the service-level guard is
// bypassed by a race condition or a redis-lock fallback. `periodStart` is
// always midnight UTC so the compound key is stable.
//
// The partial filter excludes `status: 'void'` so an admin voiding an
// invoice frees that (subscription, periodStart) slot — the next billing
// run mints a replacement, matching the service-level guard in
// billing.service.runDailyBilling. Without the partialFilterExpression,
// Mongo's unique index would still collide against the tombstoned void
// row and trap the subscription with no invoice forever.
//
// Existing production databases: drop the old plain unique index before
// redeploying (`db.invoices.dropIndex('subscription_1_periodStart_1')`)
// so Mongoose can build the partial one at boot.
InvoiceSchema.index(
  { subscription: 1, periodStart: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'void' } } }
);

export const Invoice = model<IInvoice>('Invoice', InvoiceSchema);
