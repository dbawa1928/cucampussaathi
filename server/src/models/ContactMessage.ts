import { Schema, model, Document, Model } from 'mongoose';

export type ContactUserType = 'STUDENT' | 'FACULTY' | 'OTHER';
export type ContactStatus = 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'ARCHIVED';

export interface IContactMessage extends Document {
  fullName: string;
  email: string;
  userType: ContactUserType;
  subject: string;
  message: string;
  status: ContactStatus;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    fullName: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    email: {
      type: String,
      required: [true, 'Sender email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      index: true,
    },
    userType: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'OTHER'],
      default: 'STUDENT',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [3000, 'Message cannot exceed 3000 characters'],
    },
    status: {
      type: String,
      enum: ['NEW', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED'],
      default: 'NEW',
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ContactMessageSchema.index({ createdAt: -1 });

export const ContactMessage: Model<IContactMessage> = model<IContactMessage>(
  'ContactMessage',
  ContactMessageSchema
);
