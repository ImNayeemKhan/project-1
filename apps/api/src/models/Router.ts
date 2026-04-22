import { Schema, model, Types } from 'mongoose';

export interface IRouter {
  _id: Types.ObjectId;
  name: string;
  host: string;
  port: number;
  username: string;
  passwordEncrypted: string;
  tls: boolean;
  isActive: boolean;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RouterSchema = new Schema<IRouter>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    host: { type: String, required: true },
    port: { type: Number, default: 8728 },
    username: { type: String, required: true },
    passwordEncrypted: { type: String, required: true },
    tls: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date },
  },
  { timestamps: true }
);

export const Router = model<IRouter>('Router', RouterSchema);
