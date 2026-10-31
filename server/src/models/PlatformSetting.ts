import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IAnnouncementBanner {
  enabled: boolean;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
}

export interface IPlatformSetting extends Document {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  allowStudentRegistration: boolean;
  allowTeacherRegistration: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementBanner: IAnnouncementBanner;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementBannerSchema = new Schema<IAnnouncementBanner>(
  {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: '', trim: true },
    type: { type: String, enum: ['INFO', 'WARNING', 'ALERT'], default: 'INFO' },
  },
  { _id: false }
);

const PlatformSettingSchema = new Schema<IPlatformSetting>(
  {
    platformName: {
      type: String,
      default: 'CUCampusSaathi',
      trim: true,
    },
    supportEmail: {
      type: String,
      default: 'support@cuchd.in',
      trim: true,
      lowercase: true,
    },
    supportPhone: {
      type: String,
      default: '+91 160 3051000',
      trim: true,
    },
    allowStudentRegistration: {
      type: Boolean,
      default: true,
    },
    allowTeacherRegistration: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'CUCampusSaathi is currently undergoing scheduled platform maintenance. Please check back shortly.',
      trim: true,
    },
    announcementBanner: {
      type: AnnouncementBannerSchema,
      default: () => ({ enabled: false, message: '', type: 'INFO' }),
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

export const PlatformSetting: Model<IPlatformSetting> =
  model<IPlatformSetting>('PlatformSetting', PlatformSettingSchema);

