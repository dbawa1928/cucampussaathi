import { Schema, model, Document, Model, Types } from 'mongoose';
import { CAMPUS_BLOCKS, type CampusBlock } from './Appointment';

export type FacultyVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export const RESEARCH_DOMAINS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Generative AI',
  'Natural Language Processing',
  'Computer Vision',
  'Data Science',
  'Big Data Analytics',
  'Cloud Computing',
  'Cybersecurity',
  'Network Security',
  'Blockchain',
  'Internet of Things',
  'Robotics',
  'Human Computer Interaction',
  'Software Engineering',
  'Distributed Systems',
  'Database Management',
  'Operating Systems',
  'Computer Networks',
  'Web Development',
  'Mobile Application Development',
  'Quantum Computing',
  'Information Retrieval',
  'Bioinformatics',
  'Computational Mathematics',
  'Statistics',
  'Wireless Communication',
  'VLSI Design',
  'Embedded Systems',
  'Renewable Energy',
  'Power Systems',
  'Mechanical Design',
  'Manufacturing Technology',
  'Civil Engineering',
  'Structural Engineering',
  'Business Analytics',
  'Finance',
  'Marketing',
  'Entrepreneurship',
  'Management',
  'Other',
] as const;

export type ResearchDomain = (typeof RESEARCH_DOMAINS)[number];

export interface ITeacherProfile extends Document {
  user: Types.ObjectId;
  designation: string;
  department: string;
  qualification?: string;
  specialization?: string;
  teachingSubjects?: string[];
  researchDomains: string[];
  officeLocation: string;
  campusBlock?: CampusBlock;
  roomNumber?: string;
  officeHours?: string;
  weekendAvailability: boolean;
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
    qualification: {
      type: String,
      trim: true,
      maxlength: [150, 'Qualification cannot exceed 150 characters'],
    },
    specialization: {
      type: String,
      trim: true,
      maxlength: [150, 'Specialization cannot exceed 150 characters'],
    },
    teachingSubjects: {
      type: [String],
      default: [],
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
    campusBlock: {
      type: String,
      enum: CAMPUS_BLOCKS,
    },
    roomNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Room number cannot exceed 50 characters'],
    },
    officeHours: {
      type: String,
      trim: true,
      maxlength: [100, 'Office hours description cannot exceed 100 characters'],
    },
    weekendAvailability: {
      type: Boolean,
      default: false,
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
