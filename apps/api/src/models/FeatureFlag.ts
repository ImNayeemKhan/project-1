import { Schema, model, Types } from 'mongoose';

export interface IFeatureFlag {
  _id: Types.ObjectId;
  key: string;
  description?: string;
  enabled: boolean;
  rolloutPercent?: number; // 0-100; 100 = everyone, 0 = no one, otherwise bucketed by hash(userId)
  audience?: 'all' | 'admins' | 'customers' | 'resellers';
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true, index: true, trim: true },
    description: { type: String },
    enabled: { type: Boolean, default: false },
    rolloutPercent: { type: Number, default: 100, min: 0, max: 100 },
    audience: {
      type: String,
      enum: ['all', 'admins', 'customers', 'resellers'],
      default: 'all',
    },
  },
  { timestamps: true }
);

export const FeatureFlag = model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);
