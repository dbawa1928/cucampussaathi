import { Schema, model, Document, Types } from 'mongoose';

export interface ILearningReview extends Document {
  session: Types.ObjectId;
  reviewer: Types.ObjectId;
  reviewedUser: Types.ObjectId;
  skill: Types.ObjectId;
  rating: number; // 1 to 5
  feedback: string;
  createdAt: Date;
  updatedAt: Date;
}

const LearningReviewSchema = new Schema<ILearningReview>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'LearningSession',
      required: true,
      index: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewedUser: {
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    feedback: {
      type: String,
      required: [true, 'Feedback is required'],
      trim: true,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

LearningReviewSchema.index({ session: 1, reviewer: 1 }, { unique: true });

export const LearningReviewModel = model<ILearningReview>('LearningReview', LearningReviewSchema);

