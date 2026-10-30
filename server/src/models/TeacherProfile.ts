import { Schema, model, Document, Model, Types } from 'mongoose';

export type FacultyVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ITeacherProfile extends Document {
  user: Types.ObjectId;
  designation: string;
  department: string;
  researchDomains: string[];
  officeLocation: string;
  bookingPreference: string;
  maxDailySlots: number;
  isAcceptingBookings: boolean;
  verificationStatus: FacultyVerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherProfileSchema = new Schema<ITeacherProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    designation: {
      type: String,
      required: [true, 'Faculty designation is required'],
      trim: true,
      maxlength: [100, 'Designation cannot exceed 100 characters'],
    },
    department: {
      type: String,
      required: [true, 'Academic department is required'],
      trim: true,
      index: true,
    },
    researchDomains: {
      type: [String],
      default: [],
      index: true,
    },
    officeLocation: {
      type: String,
      required: [true, 'Office or cabin location is required'],
      trim: true,
      maxlength: [100, 'Office location cannot exceed 100 characters'],
    },
    bookingPreference: {
      type: String,
      default: 'WEEKLY_OFFICE_HOURS',
      trim: true,
    },
    maxDailySlots: {
      type: Number,
      default: 4,
      min: [1, 'Must allow at least 1 slot per day'],
      max: [16, 'Cannot exceed 16 slots per day'],
    },
    isAcceptingBookings: {
      type: Boolean,
      default: true,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

export const TeacherProfile: Model<ITeacherProfile> = model<ITeacherProfile>(
  'TeacherProfile',
  TeacherProfileSchema
);
