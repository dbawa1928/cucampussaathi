import { Schema, model, Document, Types } from 'mongoose';

export interface IEmailLog extends Document {
  recipient: string;
  recipientRole: string;
  subject: string;
  templateType: string;
  appointment?: Types.ObjectId;
  status: 'SENT' | 'FAILED' | 'MOCKED';
  error?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    recipientRole: {
      type: String,
      default: 'STUDENT',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    templateType: {
      type: String,
      required: true,
      index: true,
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'MOCKED'],
      default: 'SENT',
      index: true,
    },
    error: {
      type: String,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const EmailLog = model<IEmailLog>('EmailLog', EmailLogSchema);
