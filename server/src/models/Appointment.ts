import { Schema, model, Document, Model, Types } from 'mongoose';

export type AppointmentStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED';

export type MeetingMode = 'ONLINE' | 'IN_PERSON';

export interface IAppointment extends Document {
  student: Types.ObjectId;
  teacherProfile: Types.ObjectId;
  slot: Types.ObjectId;
  agenda: string;
  status: AppointmentStatus;
  meetingMode: MeetingMode;
  meetingLink?: string;
  meetingInstructions?: string;
  reminderSentAt?: Date;
  rejectionReason?: string;
  teacherNotes?: string;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teacherProfile: {
      type: Schema.Types.ObjectId,
      ref: 'TeacherProfile',
      required: true,
      index: true,
    },
    slot: {
      type: Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
      required: true,
    },
    agenda: {
      type: String,
      required: [true, 'Discussion agenda is required'],
      trim: true,
      minlength: [10, 'Agenda must be at least 10 characters'],
      maxlength: [500, 'Agenda cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    meetingMode: {
      type: String,
      enum: ['ONLINE', 'IN_PERSON'],
      default: 'IN_PERSON',
    },
    meetingLink: {
      type: String,
      trim: true,
      maxlength: [500, 'Meeting link cannot exceed 500 characters'],
    },
    meetingInstructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Meeting instructions cannot exceed 1000 characters'],
    },
    reminderSentAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Rejection reason cannot exceed 300 characters'],
    },
    teacherNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Teacher notes cannot exceed 1000 characters'],
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a student's or teacher's appointment history
AppointmentSchema.index({ student: 1, createdAt: -1 });
AppointmentSchema.index({ teacherProfile: 1, status: 1 });
AppointmentSchema.index({ status: 1, reminderSentAt: 1 });

/**
 * Partial Unique Index:
 * Enforces that only ONE active appointment (PENDING or ACCEPTED) can exist for a given slot.
 * If an appointment is CANCELLED or REJECTED, the slot can safely be reused by future bookings!
 */
AppointmentSchema.index(
  { slot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['PENDING', 'ACCEPTED'] },
    },
  }
);

export const Appointment: Model<IAppointment> = model<IAppointment>(
  'Appointment',
  AppointmentSchema
);
