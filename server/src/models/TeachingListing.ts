import { Schema, model, Document, Types } from 'mongoose';

export type ExpertiseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type TeachingMode = 'ONLINE' | 'OFFLINE' | 'BOTH';
export type TeachingType = 'INDIVIDUAL' | 'GROUP' | 'BOTH';
export type TeachingListingStatus = 'ACTIVE' | 'PAUSED' | 'DELETED';

export interface ITeachingListing extends Document {
  user: Types.ObjectId;
  skill: Types.ObjectId;
  skillName: string;
  category: string;
  expertiseLevel: ExpertiseLevel;
  experienceMonths: number;
  description: string;
  teachingMode: TeachingMode;
  teachingType: TeachingType;
  languages: string[];
  availability: {
    days: string[];
    timeSlots: string[];
  };
  maxLearners: number;
  preferredSchedule?: string;
  proofUrl?: string;
  status: TeachingListingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TeachingListingSchema = new Schema<ITeachingListing>(
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
    expertiseLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
      required: true,
      index: true,
    },
    experienceMonths: {
      type: Number,
      required: true,
      min: [0, 'Experience months cannot be negative'],
      default: 0,
    },
    description: {
      type: String,
      required: [true, 'Description of what you teach is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    teachingMode: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'BOTH'],
      default: 'BOTH',
      index: true,
    },
    teachingType: {
      type: String,
      enum: ['INDIVIDUAL', 'GROUP', 'BOTH'],
      default: 'BOTH',
    },
    languages: {
      type: [String],
      default: ['English', 'Hindi'],
    },
    availability: {
      days: {
        type: [String],
        default: ['Monday', 'Wednesday', 'Friday'],
      },
      timeSlots: {
        type: [String],
        default: ['Evening (4 PM - 7 PM)'],
      },
    },
    maxLearners: {
      type: Number,
      default: 5,
      min: 1,
      max: 50,
    },
    preferredSchedule: {
      type: String,
      trim: true,
      maxlength: [200, 'Schedule cannot exceed 200 characters'],
    },
    proofUrl: {
      type: String,
      trim: true,
      maxlength: [500, 'URL cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'DELETED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TeachingListingSchema.index({ user: 1, skill: 1, status: 1 });
TeachingListingSchema.index({ skillName: 'text', description: 'text' });

export const TeachingListingModel = model<ITeachingListing>('TeachingListing', TeachingListingSchema);

