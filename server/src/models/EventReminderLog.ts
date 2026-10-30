import { Schema, model, Document, Model, Types } from 'mongoose';

export type EventReminderType = '24H' | '1H';

export interface IEventReminderLog extends Document {
  event: Types.ObjectId;
  user: Types.ObjectId;
  reminderType: EventReminderType;
  sentAt: Date;
  deliveryStatus: 'SENT' | 'FAILED';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventReminderLogSchema = new Schema<IEventReminderLog>(
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
    reminderType: {
      type: String,
      enum: ['24H', '1H'],
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveryStatus: {
      type: String,
      enum: ['SENT', 'FAILED'],
      default: 'SENT',
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents sending duplicate reminders for the same event and user
EventReminderLogSchema.index({ event: 1, user: 1, reminderType: 1 }, { unique: true });

export const EventReminderLog: Model<IEventReminderLog> = model<IEventReminderLog>(
  'EventReminderLog',
  EventReminderLogSchema
);
