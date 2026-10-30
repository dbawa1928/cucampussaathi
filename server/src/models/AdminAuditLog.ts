import { Schema, model, Document, Model, Types } from 'mongoose';

export type AuditAction =
  | 'FACULTY_APPROVED'
  | 'FACULTY_REJECTED'
  | 'STUDENT_SUSPENDED'
  | 'STUDENT_REACTIVATED'
  | 'TEACHER_SUSPENDED'
  | 'TEACHER_REACTIVATED'
  | 'APPOINTMENT_ADMIN_CANCELLED'
  | 'REPORT_EXPORTED'
  | 'SETTINGS_UPDATED';

export type AuditEntityType = 'USER' | 'TEACHER_PROFILE' | 'APPOINTMENT' | 'REPORT' | 'SYSTEM';

export interface IAdminAuditLog extends Document {
  adminUser: Types.ObjectId;
  action: AuditAction;
  targetUser?: Types.ObjectId;
  targetAppointment?: Types.ObjectId;
  entityType: AuditEntityType;
  reason?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    adminUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin user reference is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      index: true,
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    targetAppointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    entityType: {
      type: String,
      enum: ['USER', 'TEACHER_PROFILE', 'APPOINTMENT', 'REPORT', 'SYSTEM'],
      required: [true, 'Entity type is required'],
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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

// Compound indexes for query efficiency
AdminAuditLogSchema.index({ createdAt: -1 });
AdminAuditLogSchema.index({ adminUser: 1, createdAt: -1 });
AdminAuditLogSchema.index({ action: 1, createdAt: -1 });
AdminAuditLogSchema.index({ entityType: 1, createdAt: -1 });

export const AdminAuditLog: Model<IAdminAuditLog> = model<IAdminAuditLog>(
  'AdminAuditLog',
  AdminAuditLogSchema
);
