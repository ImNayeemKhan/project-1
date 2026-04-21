import { Schema, model, Types } from 'mongoose';

export type AddonCategory = 'ip' | 'iptv' | 'backup' | 'wifi' | 'security' | 'other';

export interface IServiceAddon {
  _id: Types.ObjectId;
  name: string;
  code: string;
  category: AddonCategory;
  tagline?: string;
  description?: string;
  monthlyPrice: number;
  setupFee: number;
  imageUrl?: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceAddonSchema = new Schema<IServiceAddon>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    category: {
      type: String,
      enum: ['ip', 'iptv', 'backup', 'wifi', 'security', 'other'],
      default: 'other',
      index: true,
    },
    tagline: { type: String, trim: true },
    description: { type: String, trim: true },
    monthlyPrice: { type: Number, required: true, min: 0 },
    setupFee: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, trim: true },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export const ServiceAddon = model<IServiceAddon>('ServiceAddon', ServiceAddonSchema);
