import { Schema, model, Document, Model, Types } from 'mongoose';

export type RegistrationStatus = 'REGISTERED' | 'CANCELLED';

export interface IEventRegistration extends Document {
  event: Types.ObjectId;
  user: Types.ObjectId;
  status: RegistrationStatus;
  registeredAt: Date;
  cancelledAt?: Date;
  attendanceConfirmed?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'CampusEvent',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['REGISTERED', 'CANCELLED'],
      default: 'REGISTERED',
      index: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
    attendanceConfirmed: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find user registration for an event
EventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

export const EventRegistration: Model<IEventRegistration> = model<IEventRegistration>(
  'EventRegistration',
  EventRegistrationSchema
);
