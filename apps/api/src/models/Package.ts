import { Schema, model, Types } from 'mongoose';

export interface IPackage {
  _id: Types.ObjectId;
  name: string;
  code: string;
  tagline?: string;
  description?: string;
  imageUrl?: string;
  downloadMbps: number;
  uploadMbps: number;
  monthlyPrice: number;
  setupFee: number;
  fupGB?: number;
  features: string[];
  mikrotikProfile?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    tagline: { type: String, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    downloadMbps: { type: Number, required: true, min: 0 },
    uploadMbps: { type: Number, required: true, min: 0 },
    monthlyPrice: { type: Number, required: true, min: 0 },
    setupFee: { type: Number, default: 0, min: 0 },
    fupGB: { type: Number, min: 0 },
    features: { type: [String], default: [] },
    mikrotikProfile: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export const Package = model<IPackage>('Package', PackageSchema);
