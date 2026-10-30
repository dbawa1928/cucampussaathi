import { Schema, model, Document, Types } from 'mongoose';

export type LearningGroupStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface ILearningGroup extends Document {
  creator: Types.ObjectId;
  skill: Types.ObjectId;
  name: string;
  description: string;
  maxMembers: number;
  mode: 'ONLINE' | 'OFFLINE' | 'BOTH';
  languages: string[];
  schedule?: string;
  status: LearningGroupStatus;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LearningGroupSchema = new Schema<ILearningGroup>(
  {
    creator: {
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
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [120, 'Group name cannot exceed 120 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Group description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    maxMembers: {
      type: Number,
      default: 15,
      min: 2,
      max: 100,
    },
    mode: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'BOTH'],
      default: 'BOTH',
    },
    languages: {
      type: [String],
      default: ['English', 'Hindi'],
    },
    schedule: {
      type: String,
      trim: true,
      maxlength: [200, 'Schedule cannot exceed 200 characters'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    memberCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

LearningGroupSchema.index({ name: 'text', description: 'text' });

export const LearningGroupModel = model<ILearningGroup>('LearningGroup', LearningGroupSchema);

