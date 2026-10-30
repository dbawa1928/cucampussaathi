import { Schema, model, Document, Types } from 'mongoose';

export type GroupMemberRole = 'GROUP_ADMIN' | 'GROUP_MEMBER';
export type GroupMembershipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'LEFT';

export interface IGroupMembership extends Document {
  group: Types.ObjectId;
  user: Types.ObjectId;
  role: GroupMemberRole;
  status: GroupMembershipStatus;
  joinMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GroupMembershipSchema = new Schema<IGroupMembership>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'LearningGroup',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['GROUP_ADMIN', 'GROUP_MEMBER'],
      default: 'GROUP_MEMBER',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'LEFT'],
      default: 'PENDING',
      index: true,
    },
    joinMessage: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

GroupMembershipSchema.index({ group: 1, user: 1 }, { unique: true });

export const GroupMembershipModel = model<IGroupMembership>('GroupMembership', GroupMembershipSchema);
