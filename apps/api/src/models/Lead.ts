import { Schema, model, Types } from 'mongoose';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadSource = 'website' | 'referral' | 'walkin' | 'phone' | 'other';

export interface ILead {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  zone?: Types.ObjectId;
  packageInterest?: Types.ObjectId;
  status: LeadStatus;
  source: LeadSource;
  notes?: string;
  assignedTo?: Types.ObjectId;
  convertedUser?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    zone: { type: Schema.Types.ObjectId, ref: 'Zone' },
    packageInterest: { type: Schema.Types.ObjectId, ref: 'Package' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
      default: 'new',
      index: true,
    },
    source: {
      type: String,
      enum: ['website', 'referral', 'walkin', 'phone', 'other'],
      default: 'website',
    },
    notes: { type: String, trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    convertedUser: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Lead = model<ILead>('Lead', LeadSchema);
