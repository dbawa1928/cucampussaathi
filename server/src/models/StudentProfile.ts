import { Schema, model, Document, Model, Types } from 'mongoose';

export type PrivacyLevel = 'PUBLIC' | 'CAMPUS_ONLY' | 'PRIVATE';

export interface IStudentProfile extends Document {
  user: Types.ObjectId;
  course: string;
  semester: number;
  bio?: string;
  skills: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  privacyLevel: PrivacyLevel;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    course: {
      type: String,
      required: [true, 'Enrolled course is required'],
      trim: true,
      maxlength: [100, 'Course name cannot exceed 100 characters'],
    },
    semester: {
      type: Number,
      required: [true, 'Current semester is required'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    socialLinks: {
      github: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      portfolio: { type: String, trim: true },
    },
    privacyLevel: {
      type: String,
      enum: ['PUBLIC', 'CAMPUS_ONLY', 'PRIVATE'],
      default: 'CAMPUS_ONLY',
    },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile: Model<IStudentProfile> = model<IStudentProfile>(
  'StudentProfile',
  StudentProfileSchema
);
