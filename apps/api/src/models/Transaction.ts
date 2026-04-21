import { Schema, model, Types } from 'mongoose';

export type TransactionType = 'credit' | 'debit';
export type TransactionReason =
  | 'wallet_topup'
  | 'invoice_payment'
  | 'refund'
  | 'manual_adjustment'
  | 'referral_bonus';

export interface ITransaction {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: TransactionType;
  amount: number;
  reason: TransactionReason;
  relatedInvoice?: Types.ObjectId;
  relatedPayment?: Types.ObjectId;
  balanceAfter: number;
  note?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['credit', 'debit'], required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: ['wallet_topup', 'invoice_payment', 'refund', 'manual_adjustment', 'referral_bonus'],
      required: true,
      index: true,
    },
    relatedInvoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    relatedPayment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    balanceAfter: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Transaction = model<ITransaction>('Transaction', TransactionSchema);
