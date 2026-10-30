import { Schema, model, Document, Model, Types } from 'mongoose';

export type SlotLocationType = 'CABIN' | 'VIRTUAL_MEET';
export type SlotStatus = 'AVAILABLE' | 'RESERVED' | 'CANCELLED';

export interface IAvailabilitySlot extends Document {
  teacherProfile: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  locationType: SlotLocationType;
  locationDetails?: string;
  isBooked: boolean;
  status: SlotStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    teacherProfile: {
      type: Schema.Types.ObjectId,
      ref: 'TeacherProfile',
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Slot start time is required (UTC)'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'Slot end time is required (UTC)'],
      validate: {
        validator: function (this: IAvailabilitySlot, value: Date) {
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: [10, 'Duration must be at least 10 minutes'],
      max: [120, 'Duration cannot exceed 120 minutes'],
    },
    locationType: {
      type: String,
      enum: ['CABIN', 'VIRTUAL_MEET'],
      default: 'CABIN',
    },
    locationDetails: {
      type: String,
      trim: true,
      maxlength: [200, 'Location details cannot exceed 200 characters'],
    },
    isBooked: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'CANCELLED'],
      default: 'AVAILABLE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying teacher available slots by date range
AvailabilitySlotSchema.index({ teacherProfile: 1, startTime: 1, isBooked: 1 });

export const AvailabilitySlot: Model<IAvailabilitySlot> = model<IAvailabilitySlot>(
  'AvailabilitySlot',
  AvailabilitySlotSchema
);
