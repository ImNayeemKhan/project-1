import { Schema, model, Types } from 'mongoose';

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory =
  | 'connection'
  | 'billing'
  | 'installation'
  | 'upgrade'
  | 'cancellation'
  | 'other';

export interface ITicketMessage {
  author: Types.ObjectId;
  authorRole: 'admin' | 'reseller' | 'customer';
  body: string;
  createdAt: Date;
}

export interface ITicket {
  _id: Types.ObjectId;
  ticketNo: string;
  customer: Types.ObjectId;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: Types.ObjectId;
  messages: ITicketMessage[];
  lastActivityAt: Date;
  slaEscalated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<ITicketMessage>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorRole: { type: String, enum: ['admin', 'reseller', 'customer'], required: true },
    body: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketNo: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['connection', 'billing', 'installation', 'upgrade', 'cancellation', 'other'],
      default: 'other',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    messages: { type: [MessageSchema], default: [] },
    lastActivityAt: { type: Date, default: () => new Date(), index: true },
    // Set once by the SLA sweep after the escalate threshold passes; prevents
    // re-bumping priority on every subsequent sweep. Cleared when a reply
    // lands or the ticket is reopened with fresh activity.
    slaEscalated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Ticket = model<ITicket>('Ticket', TicketSchema);
