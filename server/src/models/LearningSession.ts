import { Schema, model, Document, Types } from 'mongoose';

export type LearningSessionStatus =
  | 'PROPOSED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface ILearningSession extends Document {
  connection: Types.ObjectId;
  skill: Types.ObjectId;
  teacher: Types.ObjectId;
  learners: Types.ObjectId[];
  sessionTitle: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  mode: 'ONLINE' | 'OFFLINE';
  meetingLink?: string;
  location?: string;
  status: LearningSessionStatus;
  proposedBy: Types.ObjectId;
  notes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LearningSessionSchema = new Schema<ILearningSession>(
  {
    connection: {
      type: Schema.Types.ObjectId,
      ref: 'SkillConnection',
      required: true,
      index: true,
    },
    skill: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    learners: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
    ],
    sessionTitle: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    date: {
      type: String,
      required: [true, 'Session date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
      match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Time format must be HH:mm'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
      match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Time format must be HH:mm'],
    },
    mode: {
      type: String,
      enum: ['ONLINE', 'OFFLINE'],
      default: 'ONLINE',
    },
    meetingLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^https:\/\/[^\s$.?#].[^\s]*$/i.test(v);
        },
        message: 'Online meeting link must be a valid secure HTTPS URL',
      },
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    status: {
      type: String,
      enum: ['PROPOSED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
      default: 'PROPOSED',
      index: true,
    },
    proposedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

LearningSessionSchema.index({ teacher: 1, date: 1, status: 1 });
LearningSessionSchema.index({ learners: 1, date: 1, status: 1 });

export const LearningSessionModel = model<ILearningSession>('LearningSession', LearningSessionSchema);
