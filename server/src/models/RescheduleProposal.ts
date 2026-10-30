import { Schema, model, Document, Model, Types } from 'mongoose';

export type RescheduleStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface IRescheduleProposal extends Document {
  appointment: Types.ObjectId;
  proposedBy: Types.ObjectId;
  proposedSlot: Types.ObjectId;
  originalSlot: Types.ObjectId;
  reason?: string;
  status: RescheduleStatus;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RescheduleProposalSchema = new Schema<IRescheduleProposal>(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
      index: true,
    },
    proposedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Proposer reference is required'],
      index: true,
    },
    proposedSlot: {
      type: Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
      required: [true, 'Proposed slot reference is required'],
      index: true,
    },
    originalSlot: {
      type: Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
      required: [true, 'Original slot reference is required'],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rescheduling reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      default: 'PENDING',
      index: true,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for conflict detection and active proposal queries
RescheduleProposalSchema.index({ appointment: 1, status: 1 });
RescheduleProposalSchema.index({ proposedSlot: 1, status: 1 });
RescheduleProposalSchema.index({ proposedBy: 1, createdAt: -1 });

export const RescheduleProposal: Model<IRescheduleProposal> = model<IRescheduleProposal>(
  'RescheduleProposal',
  RescheduleProposalSchema
);
