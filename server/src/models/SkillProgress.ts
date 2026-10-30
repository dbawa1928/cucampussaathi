import { Schema, model, Document, Types } from 'mongoose';

export interface ILearningMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface ISkillProgress extends Document {
  user: Types.ObjectId;
  skill: Types.ObjectId;
  skillName: string;
  learningGoal?: Types.ObjectId;
  startingLevel: string;
  currentLevel: string;
  targetLevel: string;
  completedSessionsCount: number;
  milestones: ILearningMilestone[];
  notes?: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillProgressSchema = new Schema<ISkillProgress>(
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
    },
    learningGoal: {
      type: Schema.Types.ObjectId,
      ref: 'LearningGoal',
    },
    startingLevel: {
      type: String,
      default: 'BEGINNER',
    },
    currentLevel: {
      type: String,
      default: 'BEGINNER',
    },
    targetLevel: {
      type: String,
      default: 'INTERMEDIATE',
    },
    completedSessionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    milestones: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

SkillProgressSchema.index({ user: 1, skill: 1 }, { unique: true });

export const SkillProgressModel = model<ISkillProgress>('SkillProgress', SkillProgressSchema);

