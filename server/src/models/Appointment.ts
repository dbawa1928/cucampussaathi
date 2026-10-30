import { Schema, model, Document, Model, Types } from 'mongoose';

export type AppointmentStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED';

export type MeetingMode = 'ONLINE' | 'IN_PERSON';
export type AttendanceStatus = 'NOT_MARKED' | 'ATTENDED' | 'NO_SHOW';

export const CAMPUS_BLOCKS = [
  'A1', 'A2', 'A3',
  'B1', 'B2', 'B3', 'B4', 'B5',
  'C1', 'C2', 'C3',
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8',
  'DD1', 'DD2', 'DD3',
  'SPORTS COMPLEX',
] as const;

export type CampusBlock = (typeof CAMPUS_BLOCKS)[number];

export interface INoShowAppeal {
  appealedAt: Date;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  adminReviewNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
}

export interface IAppointment extends Document {
  student: Types.ObjectId;
  teacherProfile: Types.ObjectId;
  slot: Types.ObjectId;
  agenda: string;
  status: AppointmentStatus;
  meetingMode: MeetingMode;
  campusBlock?: CampusBlock;
  roomNumber?: string;
  meetingLink?: string;
  meetingInstructions?: string;
  approvedAt?: Date;
  reminderSentAt?: Date;
  reminder1hSentAt?: Date;
  rejectionReason?: string;
  teacherNotes?: string;
  attendanceStatus: AttendanceStatus;
  attendanceMarkedAt?: Date;
  attendanceMarkedBy?: Types.ObjectId;
  noShowReason?: string;
  noShowAppeal?: INoShowAppeal;
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
      validate: {
        validator: function (v: string) {
          if (!v) return false;
          const words = v.trim().split(/\s+/).filter(Boolean).length;
          return words >= 1 && words <= 400;
        },
        message: 'Discussion agenda cannot exceed 400 words.',
      },
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
    campusBlock: {
      type: String,
      enum: CAMPUS_BLOCKS,
    },
    roomNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Room number cannot exceed 50 characters'],
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
    approvedAt: {
      type: Date,
    },
    reminderSentAt: {
      type: Date,
    },
    reminder1hSentAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    teacherNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Teacher notes cannot exceed 1000 characters'],
    },
    attendanceStatus: {
      type: String,
      enum: ['NOT_MARKED', 'ATTENDED', 'NO_SHOW'],
      default: 'NOT_MARKED',
    },
    attendanceMarkedAt: {
      type: Date,
    },
    attendanceMarkedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    noShowReason: {
      type: String,
      trim: true,
      maxlength: [500, 'No-show explanation cannot exceed 500 characters'],
    },
    noShowAppeal: {
      appealedAt: { type: Date },
      reason: { type: String, trim: true, maxlength: 1000 },
      status: {
        type: String,
        enum: ['PENDING', 'RESOLVED', 'REJECTED'],
        default: 'PENDING',
      },
      adminReviewNotes: { type: String, trim: true, maxlength: 1000 },
      resolvedAt: { type: Date },
      resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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
AppointmentSchema.index({ attendanceStatus: 1 });

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
