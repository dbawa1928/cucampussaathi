import { Schema, model, Document, Types } from 'mongoose';

export interface ITeacherStudentRestriction extends Document {
  teacher: Types.ObjectId;
  student: Types.ObjectId;
  isActive: boolean;
  reason: string;
  notes?: string;
  blockedAt: Date;
  blockedBy: Types.ObjectId;
  unblockedAt?: Date;
  unblockedBy?: Types.ObjectId;
  unblockReason?: string;
  unblockedByAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherStudentRestrictionSchema = new Schema<ITeacherStudentRestriction>(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required'],
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Blocking reason is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    blockedAt: {
      type: Date,
      default: Date.now,
    },
    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    unblockedAt: {
      type: Date,
    },
    unblockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    unblockReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Unblock reason cannot exceed 500 characters'],
    },
    unblockedByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure at most ONE active restriction per teacher-student pair
TeacherStudentRestrictionSchema.index(
  { teacher: 1, student: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

TeacherStudentRestrictionSchema.index({ teacher: 1, isActive: 1, createdAt: -1 });
TeacherStudentRestrictionSchema.index({ student: 1, isActive: 1 });

export const TeacherStudentRestriction = model<ITeacherStudentRestriction>(
  'TeacherStudentRestriction',
  TeacherStudentRestrictionSchema
);
