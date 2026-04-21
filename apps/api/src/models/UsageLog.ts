import { Schema, model, Types } from 'mongoose';

export interface IUsageLog {
  _id: Types.ObjectId;
  subscription: Types.ObjectId;
  customer: Types.ObjectId;
  day: Date; // UTC midnight of the day
  downloadMB: number;
  uploadMB: number;
  totalMB: number;
  createdAt: Date;
  updatedAt: Date;
}

const UsageLogSchema = new Schema<IUsageLog>(
  {
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    day: { type: Date, required: true, index: true },
    downloadMB: { type: Number, default: 0, min: 0 },
    uploadMB: { type: Number, default: 0, min: 0 },
    totalMB: { type: Number, default: 0, min: 0, index: true },
  },
  { timestamps: true }
);

UsageLogSchema.index({ subscription: 1, day: 1 }, { unique: true });

export const UsageLog = model<IUsageLog>('UsageLog', UsageLogSchema);
