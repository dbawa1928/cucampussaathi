import { Schema, model, Document, Model, Types } from 'mongoose';

export type EventCategory =
  | 'Workshops'
  | 'Seminars'
  | 'Guest Lectures'
  | 'Webinars'
  | 'Hackathons'
  | 'Competitions'
  | 'Technical Events'
  | 'Cultural Events'
  | 'Sports Events'
  | 'Placement & Career Events'
  | 'Club Activities'
  | 'Faculty Events'
  | 'Other';

export type EventMode = 'ONLINE' | 'OFFLINE';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface ISpeakerDetails {
  name: string;
  designation?: string;
  organization?: string;
}

export interface ICampusEvent extends Document {
  title: string;
  slug: string;
  category: EventCategory;
  shortDescription: string;
  description: string;
  bannerUrl?: string;

  startDateTime: Date;
  endDateTime: Date;
  timezone: string;

  mode: EventMode;
  campusBlock?: string;
  venue?: string;
  roomNumber?: string;
  onlinePlatform?: string;
  publicMeetingUrl?: string;

  organizerName: string;
  organizerDepartment?: string;
  speakerDetails?: ISpeakerDetails;

  registrationEnabled: boolean;
  registrationUrl?: string;
  registrationDeadline?: Date;
  capacity: number; // 0 = unlimited
  registeredCount: number;

  contactEmail?: string;
  contactPhone?: string;
  additionalInstructions?: string;

  status: EventStatus;
  isFeatured?: boolean;
  publishedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const SpeakerDetailsSchema = new Schema<ISpeakerDetails>(
  {
    name: { type: String, trim: true },
    designation: { type: String, trim: true },
    organization: { type: String, trim: true },
  },
  { _id: false }
);

const CampusEventSchema = new Schema<ICampusEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Event title must be at least 3 characters'],
      maxlength: [200, 'Event title cannot exceed 200 characters'],
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      enum: [
        'Workshops',
        'Seminars',
        'Guest Lectures',
        'Webinars',
        'Hackathons',
        'Competitions',
        'Technical Events',
        'Cultural Events',
        'Sports Events',
        'Placement & Career Events',
        'Club Activities',
        'Faculty Events',
        'Other',
      ],
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'Full description is required'],
      trim: true,
    },
    bannerUrl: {
      type: String,
      trim: true,
    },
    startDateTime: {
      type: Date,
      required: [true, 'Event start date/time is required'],
      index: true,
    },
    endDateTime: {
      type: Date,
      required: [true, 'Event end date/time is required'],
      index: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    mode: {
      type: String,
      required: [true, 'Event mode is required'],
      enum: ['ONLINE', 'OFFLINE'],
      index: true,
    },
    campusBlock: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    onlinePlatform: {
      type: String,
      trim: true,
    },
    publicMeetingUrl: {
      type: String,
      trim: true,
    },
    organizerName: {
      type: String,
      required: [true, 'Organizer name is required'],
      trim: true,
    },
    organizerDepartment: {
      type: String,
      trim: true,
    },
    speakerDetails: {
      type: SpeakerDetailsSchema,
      default: undefined,
    },
    registrationEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    registrationUrl: {
      type: String,
      trim: true,
    },
    registrationDeadline: {
      type: Date,
    },
    capacity: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    additionalInstructions: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
      default: 'DRAFT',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

CampusEventSchema.index({ status: 1, startDateTime: 1 });
CampusEventSchema.index({ category: 1, status: 1 });
CampusEventSchema.index({ createdBy: 1, status: 1 });

export const CampusEvent: Model<ICampusEvent> = model<ICampusEvent>(
  'CampusEvent',
  CampusEventSchema
);
