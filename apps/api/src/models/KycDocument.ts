import { Schema, model, Types } from 'mongoose';

export type KycDocType = 'nid_front' | 'nid_back' | 'passport' | 'address_proof' | 'photo' | 'other';
export type KycStatus = 'pending' | 'verified' | 'rejected';

export interface IKycDocument {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  type: KycDocType;
  url: string;
  status: KycStatus;
  rejectReason?: string;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KycDocumentSchema = new Schema<IKycDocument>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['nid_front', 'nid_back', 'passport', 'address_proof', 'photo', 'other'],
      required: true,
    },
    url: { type: String, required: true },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', index: true },
    rejectReason: { type: String, trim: true },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const KycDocument = model<IKycDocument>('KycDocument', KycDocumentSchema);
