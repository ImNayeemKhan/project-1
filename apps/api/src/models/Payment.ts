import { Schema, model, Types } from 'mongoose';

export type PaymentGateway = 'bkash' | 'nagad' | 'cash' | 'manual';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';

export interface IPayment {
  _id: Types.ObjectId;
  invoice: Types.ObjectId;
  customer: Types.ObjectId;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  gatewayTxnId?: string;
  gatewayPaymentId?: string;
  status: PaymentStatus;
  rawPayload?: unknown;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gateway: {
      type: String,
      enum: ['bkash', 'nagad', 'cash', 'manual'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
    gatewayTxnId: { type: String, index: true, sparse: true },
    gatewayPaymentId: { type: String, index: true, sparse: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    rawPayload: { type: Schema.Types.Mixed },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', PaymentSchema);
