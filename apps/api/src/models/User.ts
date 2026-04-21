import { Schema, model, Types, HydratedDocument } from 'mongoose';

export type UserRole = 'admin' | 'reseller' | 'customer';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDoc = HydratedDocument<IUser>;

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, index: true, sparse: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'reseller', 'customer'], default: 'customer', index: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
