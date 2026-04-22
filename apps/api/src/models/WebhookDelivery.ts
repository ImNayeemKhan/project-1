import { Schema, model, Types } from 'mongoose';

export interface IWebhookDelivery {
  _id: Types.ObjectId;
  subscription: Types.ObjectId;
  event: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed';
  httpStatus?: number;
  attempts: number;
  lastError?: string;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookDeliverySchema = new Schema<IWebhookDelivery>(
  {
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'WebhookSubscription',
      required: true,
      index: true,
    },
    event: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    httpStatus: { type: Number },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

export const WebhookDelivery = model<IWebhookDelivery>(
  'WebhookDelivery',
  WebhookDeliverySchema
);
