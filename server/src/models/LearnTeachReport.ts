import { Schema, model, Document, Types } from 'mongoose';

export type ReportTargetType = 'USER' | 'TEACHING_LISTING' | 'LEARNING_GROUP' | 'MESSAGE';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN';

export interface ILearnTeachReport extends Document {
  reporter: Types.ObjectId;
  targetType: ReportTargetType;
  targetId: Types.ObjectId;
  reportedUser?: Types.ObjectId;
  reason: string;
  details?: string;
  status: ReportStatus;
  reviewedBy?: Types.ObjectId;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LearnTeachReportSchema = new Schema<ILearnTeachReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['USER', 'TEACHING_LISTING', 'LEARNING_GROUP', 'MESSAGE'],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reportedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      trim: true,
      maxlength: [200, 'Reason cannot exceed 200 characters'],
    },
    details: {
      type: String,
      trim: true,
      maxlength: [1000, 'Details cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

export const LearnTeachReportModel = model<ILearnTeachReport>('LearnTeachReport', LearnTeachReportSchema);

