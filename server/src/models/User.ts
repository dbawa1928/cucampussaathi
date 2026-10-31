import { Schema, model, Document, Model, Types } from 'mongoose';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface IUser extends Document {
  fullName: string;
  email: string;
  uid: string;
  passwordHash: string;
  role: UserRole;
  adminRole?: AdminRole;
  adminNotes?: string;
  department: string;
  isVerified: boolean;
  accountStatus: AccountStatus;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [150, 'Full name cannot exceed 150 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      index: true,
    },
    uid: {
      type: String,
      required: [true, 'University UID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, 'UID must be at least 3 characters'],
      maxlength: [50, 'UID cannot exceed 50 characters'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['STUDENT', 'TEACHER', 'ADMIN'],
        message: '{VALUE} is not a supported university role',
      },
      default: 'STUDENT',
      index: true,
    },
    adminRole: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
      default: 'ADMIN',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Admin notes cannot exceed 2000 characters'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'],
      default: 'ACTIVE',
      index: true,
    },
    suspensionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Suspension reason cannot exceed 500 characters'],
    },
    suspendedAt: {
      type: Date,
    },
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User: Model<IUser> = model<IUser>('User', UserSchema);
