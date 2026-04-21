import { Schema, model, Types } from 'mongoose';

export interface IZone {
  _id: Types.ObjectId;
  name: string;
  code: string;
  city?: string;
  description?: string;
  coverageNote?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ZoneSchema = new Schema<IZone>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    city: { type: String, trim: true },
    description: { type: String, trim: true },
    coverageNote: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Zone = model<IZone>('Zone', ZoneSchema);
