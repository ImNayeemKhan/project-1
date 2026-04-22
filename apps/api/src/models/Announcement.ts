import { Schema, model, Types } from 'mongoose';

export type AnnouncementAudience = 'all' | 'active' | 'suspended' | 'admins';
export type AnnouncementSeverity = 'info' | 'warning' | 'critical';

export interface IAnnouncement {
  _id: Types.ObjectId;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  severity: AnnouncementSeverity;
  publishedAt: Date;
  expiresAt?: Date;
  isPinned: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ['all', 'active', 'suspended', 'admins'],
      default: 'all',
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    publishedAt: { type: Date, default: () => new Date(), index: true },
    expiresAt: { type: Date, index: true },
    isPinned: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Announcement = model<IAnnouncement>('Announcement', AnnouncementSchema);
