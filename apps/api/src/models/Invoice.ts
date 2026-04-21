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
  },
  { timestamps: true }
);

export const Invoice = model<IInvoice>('Invoice', InvoiceSchema);
