import { Schema, model, Types } from 'mongoose';

export type SubscriptionStatus = 'pending' | 'active' | 'suspended' | 'cancelled';

export interface ISubscription {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  package: Types.ObjectId;
  router?: Types.ObjectId;
  pppoeUsername: string;
  pppoePasswordEncrypted: string;
  ipAddress?: string;
  status: SubscriptionStatus;
  activatedAt?: Date;
  nextBillingDate: Date;
  suspendedAt?: Date;
  cancelledAt?: Date;
  notes?: string;
  // Self-service fields.
  autoPay?: boolean;
  pausedAt?: Date;
  pauseEndsAt?: Date;
  pauseDaysUsedThisYear?: number;
  pauseYearStartedAt?: Date;
  pendingPackage?: Types.ObjectId; // Queued plan change for next cycle.
  pendingPackageEffectiveAt?: Date;
  referralCode?: string;
  referredBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    package: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
    router: { type: Schema.Types.ObjectId, ref: 'Router' },
    pppoeUsername: { type: String, required: true, unique: true, trim: true },
    pppoePasswordEncrypted: { type: String, required: true },
    ipAddress: { type: String },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'cancelled'],
      default: 'pending',
      index: true,
    },
    activatedAt: { type: Date },
    nextBillingDate: { type: Date, required: true, index: true },
    suspendedAt: { type: Date },
    cancelledAt: { type: Date },
    notes: { type: String },
    autoPay: { type: Boolean, default: false },
    pausedAt: { type: Date },
    pauseEndsAt: { type: Date },
    pauseDaysUsedThisYear: { type: Number, default: 0 },
    pauseYearStartedAt: { type: Date },
    pendingPackage: { type: Schema.Types.ObjectId, ref: 'Package' },
    pendingPackageEffectiveAt: { type: Date },
    referralCode: { type: String, index: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription>('Subscription', SubscriptionSchema);
