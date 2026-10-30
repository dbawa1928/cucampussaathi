import { Schema, model, Document, Types } from 'mongoose';

export type CurrentKnowledgeLevel = 'BEGINNER' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
export type TargetKnowledgeLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type LearningMode = 'ONLINE' | 'OFFLINE' | 'BOTH';
export type LearningType = 'INDIVIDUAL' | 'GROUP' | 'BOTH';
export type LearningGoalUrgency = 'LOW' | 'MEDIUM' | 'HIGH';
export type LearningGoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DELETED';

export interface ILearningGoal extends Document {
  user: Types.ObjectId;
  skill: Types.ObjectId;
  skillName: string;
  category: string;
  currentLevel: CurrentKnowledgeLevel;
  targetLevel: TargetKnowledgeLevel;
  learningObjective: string;
  preferredMode: LearningMode;
  preferredType: LearningType;
  preferredLanguages: string[];
  availableDays: string[];
  preferredTime?: string;
  urgency: LearningGoalUrgency;
  expectedDuration?: string;
  status: LearningGoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LearningGoalSchema = new Schema<ILearningGoal>(
  {
    user: {
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
    skillName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    currentLevel: {
      type: String,
      enum: ['BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER',
    },
    targetLevel: {
      type: String,
      enum: ['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
      default: 'INTERMEDIATE',
    },
    learningObjective: {
      type: String,
      required: [true, 'Learning objective is required'],
      trim: true,
      maxlength: [1000, 'Learning objective cannot exceed 1000 characters'],
    },
    preferredMode: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'BOTH'],
      default: 'BOTH',
      index: true,
    },
    preferredType: {
      type: String,
      enum: ['INDIVIDUAL', 'GROUP', 'BOTH'],
      default: 'BOTH',
    },
    preferredLanguages: {
      type: [String],
      default: ['English', 'Hindi'],
    },
    availableDays: {
      type: [String],
      default: ['Saturday', 'Sunday'],
    },
    preferredTime: {
      type: String,
      trim: true,
      maxlength: [100, 'Preferred time cannot exceed 100 characters'],
    },
    urgency: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    expectedDuration: {
      type: String,
      trim: true,
      maxlength: [100, 'Duration cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'DELETED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

LearningGoalSchema.index({ user: 1, skill: 1, status: 1 });
LearningGoalSchema.index({ skillName: 'text', learningObjective: 'text' });

export const LearningGoalModel = model<ILearningGoal>('LearningGoal', LearningGoalSchema);

