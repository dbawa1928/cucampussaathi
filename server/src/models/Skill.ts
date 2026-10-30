import { Schema, model, Document, Types } from 'mongoose';

export interface ISkill extends Document {
  name: string;
  normalizedName: string;
  category: string;
  description?: string;
  isActive: boolean;
  isCustom: boolean;
  creator?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const SKILL_CATEGORIES = [
  'Programming & Development',
  'Web Development',
  'App Development',
  'Data Science & AI',
  'Machine Learning',
  'Cybersecurity',
  'Computer Science Fundamentals',
  'Mathematics',
  'Probability & Statistics',
  'Communication Skills',
  'Design & Creativity',
  'Business & Management',
  'Research & Academic Skills',
  'Competitive Programming',
  'Other Skills',
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

const SkillSchema = new Schema<ISkill>(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      maxlength: [100, 'Skill name cannot exceed 100 characters'],
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Skill category is required'],
      enum: SKILL_CATEGORIES,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

SkillSchema.index({ name: 'text', description: 'text' });

export const SkillModel = model<ISkill>('Skill', SkillSchema);

