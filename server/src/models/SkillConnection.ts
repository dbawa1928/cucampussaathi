import { Schema, model, Document, Types } from 'mongoose';

export type SkillConnectionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ISkillConnection extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  skill: Types.ObjectId;
  teachingListing?: Types.ObjectId;
  learningGoal?: Types.ObjectId;
  status: SkillConnectionStatus;
  requestMessage: string;
  learningObjective?: string;
  preferredMode: 'ONLINE' | 'OFFLINE' | 'BOTH';
  preferredSchedule?: string;
  rejectionReason?: string;
  cancelledBy?: Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillConnectionSchema = new Schema<ISkillConnection>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skill: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    teachingListing: {
      type: Schema.Types.ObjectId,
      ref: 'TeachingListing',
    },
    learningGoal: {
      type: Schema.Types.ObjectId,
      ref: 'LearningGoal',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    requestMessage: {
      type: String,
      required: [true, 'Request message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    learningObjective: {
      type: String,
      trim: true,
      maxlength: [1000, 'Objective cannot exceed 1000 characters'],
    },
    preferredMode: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'BOTH'],
      default: 'BOTH',
    },
    preferredSchedule: {
      type: String,
      trim: true,
      maxlength: [200, 'Schedule cannot exceed 200 characters'],
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

SkillConnectionSchema.index({ sender: 1, receiver: 1, skill: 1, status: 1 });

export const SkillConnectionModel = model<ISkillConnection>('SkillConnection', SkillConnectionSchema);

