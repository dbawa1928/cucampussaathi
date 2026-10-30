import { Schema, model, Document, Model, Types } from 'mongoose';

export type NotificationType =
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_ACCEPTED'
  | 'APPOINTMENT_REJECTED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_COMPLETED'
  | 'APPOINTMENT_RESCHEDULE_REQUESTED'
  | 'APPOINTMENT_RESCHEDULE_ACCEPTED'
  | 'APPOINTMENT_RESCHEDULE_REJECTED'
  | 'CONSULTATION_REMINDER'
  | 'MEETING_LINK_ADDED'
  | 'FACULTY_VERIFIED'
  | 'FACULTY_REJECTED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_REACTIVATED'
  | 'APPOINTMENT_ADMIN_CANCELLED'
  | 'LEARN_TEACH_CONNECTION_REQUEST'
  | 'LEARN_TEACH_CONNECTION_ACCEPTED'
  | 'LEARN_TEACH_CONNECTION_REJECTED'
  | 'LEARN_TEACH_SESSION_PROPOSED'
  | 'LEARN_TEACH_SESSION_CONFIRMED'
  | 'LEARN_TEACH_SESSION_CANCELLED'
  | 'LEARN_TEACH_GROUP_INVITE'
  | 'LEARN_TEACH_MESSAGE'
  | 'EVENT_REGISTRATION_CONFIRMED'
  | 'EVENT_REGISTRATION_CANCELLED'
  | 'EVENT_CANCELLED'
  | 'EVENT_UPDATED'
  | 'EVENT_REMINDER_24H'
  | 'EVENT_REMINDER_1H'
  | 'EVENT_PUBLISHED';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedAppointment?: Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'APPOINTMENT_BOOKED',
        'APPOINTMENT_ACCEPTED',
        'APPOINTMENT_REJECTED',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_COMPLETED',
        'APPOINTMENT_RESCHEDULE_REQUESTED',
        'APPOINTMENT_RESCHEDULE_ACCEPTED',
        'APPOINTMENT_RESCHEDULE_REJECTED',
        'CONSULTATION_REMINDER',
        'MEETING_LINK_ADDED',
        'FACULTY_VERIFIED',
        'FACULTY_REJECTED',
        'ACCOUNT_SUSPENDED',
        'ACCOUNT_REACTIVATED',
        'APPOINTMENT_ADMIN_CANCELLED',
        'LEARN_TEACH_CONNECTION_REQUEST',
        'LEARN_TEACH_CONNECTION_ACCEPTED',
        'LEARN_TEACH_CONNECTION_REJECTED',
        'LEARN_TEACH_SESSION_PROPOSED',
        'LEARN_TEACH_SESSION_CONFIRMED',
        'LEARN_TEACH_SESSION_CANCELLED',
        'LEARN_TEACH_GROUP_INVITE',
        'LEARN_TEACH_MESSAGE',
        'EVENT_REGISTRATION_CONFIRMED',
        'EVENT_REGISTRATION_CANCELLED',
        'EVENT_CANCELLED',
        'EVENT_UPDATED',
        'EVENT_REMINDER_24H',
        'EVENT_REMINDER_1H',
        'EVENT_PUBLISHED',
      ],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    relatedAppointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize query for user inbox with unread filters and sorted by newest first
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Optimize query for reminder deduplication and appointment-linked notifications
NotificationSchema.index({ relatedAppointment: 1, type: 1 });

export const Notification: Model<INotification> = model<INotification>(
  'Notification',
  NotificationSchema
);
