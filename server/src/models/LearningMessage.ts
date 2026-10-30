import { Schema, model, Document, Types } from 'mongoose';

export interface ILearningMessage extends Document {
  connection?: Types.ObjectId;
  group?: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LearningMessageSchema = new Schema<ILearningMessage>(
  {
    connection: {
      type: Schema.Types.ObjectId,
      ref: 'SkillConnection',
      index: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: 'LearningGroup',
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [3000, 'Message cannot exceed 3000 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

LearningMessageSchema.index({ connection: 1, createdAt: 1 });
LearningMessageSchema.index({ group: 1, createdAt: 1 });

export const LearningMessageModel = model<ILearningMessage>('LearningMessage', LearningMessageSchema);
