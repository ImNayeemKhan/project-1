import { Schema, model, Types } from 'mongoose';

export interface IPackage {
  _id: Types.ObjectId;
  name: string;
  code: string;
  downloadMbps: number;
  uploadMbps: number;
  monthlyPrice: number;
  fupGB?: number;
  mikrotikProfile?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    downloadMbps: { type: Number, required: true, min: 0 },
    uploadMbps: { type: Number, required: true, min: 0 },
    monthlyPrice: { type: Number, required: true, min: 0 },
    fupGB: { type: Number, min: 0 },
    mikrotikProfile: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Package = model<IPackage>('Package', PackageSchema);
