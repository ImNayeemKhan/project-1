import { Schema, model, Types } from 'mongoose';

export type FtpCategory = 'entertainment' | 'carrier' | 'business' | 'partnership';
export type FtpAccessLevel = 'public' | 'customer' | 'business' | 'partner';

export interface IFtpServer {
  _id: Types.ObjectId;
  name: string;
  code: string;
  category: FtpCategory;
  tagline?: string;
  description?: string;
  host: string;
  webUrl?: string;
  port: number;
  protocol: 'ftp' | 'http' | 'https' | 'smb';
  accessLevel: FtpAccessLevel;
  capacityTB: number;
  maxSpeedMbps: number;
  contentTypes: string[];
  features: string[];
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const FtpServerSchema = new Schema<IFtpServer>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['entertainment', 'carrier', 'business', 'partnership'],
      index: true,
    },
    tagline: { type: String, trim: true },
    description: { type: String, trim: true },
    host: { type: String, required: true, trim: true },
    webUrl: { type: String, trim: true },
    port: { type: Number, default: 21, min: 1, max: 65535 },
    protocol: { type: String, enum: ['ftp', 'http', 'https', 'smb'], default: 'ftp' },
    accessLevel: {
      type: String,
      enum: ['public', 'customer', 'business', 'partner'],
      default: 'customer',
      index: true,
    },
    capacityTB: { type: Number, default: 0, min: 0 },
    maxSpeedMbps: { type: Number, default: 1000, min: 0 },
    contentTypes: { type: [String], default: [] },
    features: { type: [String], default: [] },
    imageUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export const FtpServer = model<IFtpServer>('FtpServer', FtpServerSchema);
