import { z } from 'zod';

export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const registerSchema = z
  .object({
    fullName: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(150, 'Full name cannot exceed 150 characters'),
    email: z
      .string({ required_error: 'University email is required' })
      .trim()
      .toLowerCase()
      .email('Please enter a valid university email address'),
    uid: z
      .string({ required_error: 'University UID or Faculty ID is required' })
      .trim()
      .toUpperCase()
      .min(3, 'UID must be at least 3 characters')
      .max(50, 'UID cannot exceed 50 characters'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN'], {
      required_error: 'Role is required (STUDENT or TEACHER)',
    }),
    department: z
      .string({ required_error: 'Department is required' })
      .trim()
      .min(2, 'Department name is too short')
      .max(100, 'Department name cannot exceed 100 characters'),
    // Role-dependent fields
    course: z.string().optional(),
    semester: z.number().int().min(1).max(8).optional(),
    designation: z.string().optional(),
    officeLocation: z.string().optional(),
    researchDomains: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    // 1. Strict security rule: Never allow self-registration as ADMIN
    if (data.role === 'ADMIN') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role'],
        message: 'Administrative accounts cannot be self-registered through the public portal',
      });
    }

    // 2. Validate Student fields
    if (data.role === 'STUDENT') {
      if (!data.course || data.course.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['course'],
          message: 'Enrolled course is required for students',
        });
      }
      if (data.semester === undefined || data.semester === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['semester'],
          message: 'Current semester (1-8) is required for students',
        });
      }
    }

    // 3. Validate Teacher fields
    if (data.role === 'TEACHER') {
      if (!data.designation || data.designation.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['designation'],
          message: 'Faculty designation is required for teachers',
        });
      }
    }
  });

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: 'Email or University UID is required' })
    .trim()
    .min(3, 'Identifier must be at least 3 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

const urlRegex = /^https?:\/\/.+/i;

export const studentProfileSchema = z.object({
  course: z
    .string({ required_error: 'Course is required' })
    .trim()
    .min(2, 'Course name must be at least 2 characters')
    .max(100, 'Course cannot exceed 100 characters'),
  semester: z
    .number({ required_error: 'Semester is required' })
    .int('Semester must be an integer')
    .min(1, 'Semester must be between 1 and 8')
    .max(8, 'Semester must be between 1 and 8'),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional()
    .default(''),
  skills: z
    .array(z.string().trim().max(50, 'Individual skill cannot exceed 50 characters'))
    .max(30, 'You can add up to 30 skills')
    .optional()
    .transform((skills) => {
      if (!skills) return [];
      const seen = new Set<string>();
      const result: string[] = [];
      for (const s of skills) {
        const trimmed = s.trim();
        const lower = trimmed.toLowerCase();
        if (trimmed.length > 0 && !seen.has(lower)) {
          seen.add(lower);
          result.push(trimmed);
        }
      }
      return result;
    })
    .default([]),
  socialLinks: z
    .object({
      github: z
        .string()
        .trim()
        .regex(urlRegex, 'GitHub URL must start with http:// or https://')
        .max(200, 'URL too long')
        .optional()
        .or(z.literal('')),
      linkedin: z
        .string()
        .trim()
        .regex(urlRegex, 'LinkedIn URL must start with http:// or https://')
        .max(200, 'URL too long')
        .optional()
        .or(z.literal('')),
      portfolio: z
        .string()
        .trim()
        .regex(urlRegex, 'Portfolio URL must start with http:// or https://')
        .max(200, 'URL too long')
        .optional()
        .or(z.literal('')),
    })
    .optional()
    .default({}),
  privacyLevel: z
    .enum(['PUBLIC', 'CAMPUS_ONLY', 'PRIVATE'], {
      errorMap: () => ({ message: 'Privacy level must be PUBLIC, CAMPUS_ONLY, or PRIVATE' }),
    })
    .optional()
    .default('CAMPUS_ONLY'),
});

export const teacherProfileSchema = z.object({
  designation: z
    .string({ required_error: 'Designation is required' })
    .trim()
    .min(2, 'Designation must be at least 2 characters')
    .max(100, 'Designation cannot exceed 100 characters'),
  department: z
    .string({ required_error: 'Department is required' })
    .trim()
    .min(2, 'Department must be at least 2 characters')
    .max(100, 'Department cannot exceed 100 characters'),
  researchDomains: z
    .array(z.string().trim().max(80, 'Research domain cannot exceed 80 characters'))
    .max(20, 'You can add up to 20 research domains')
    .optional()
    .transform((domains) => {
      if (!domains) return [];
      const seen = new Set<string>();
      const result: string[] = [];
      for (const d of domains) {
        const trimmed = d.trim();
        const lower = trimmed.toLowerCase();
        if (trimmed.length > 0 && !seen.has(lower)) {
          seen.add(lower);
          result.push(trimmed);
        }
      }
      return result;
    })
    .default([]),
  officeLocation: z
    .string({ required_error: 'Office location is required' })
    .trim()
    .min(2, 'Office location must be at least 2 characters')
    .max(100, 'Office location cannot exceed 100 characters'),
  bookingPreference: z
    .string()
    .trim()
    .max(100, 'Booking preference cannot exceed 100 characters')
    .optional()
    .default('WEEKLY_OFFICE_HOURS'),
  maxDailySlots: z
    .number()
    .int('Max daily slots must be an integer')
    .min(1, 'At least 1 slot is required')
    .max(16, 'Cannot exceed 16 slots per day')
    .optional()
    .default(4),
  isAcceptingBookings: z.boolean().optional().default(true),
});

export const directoryQuerySchema = z.object({
  type: z.enum(['all', 'student', 'teacher']).optional().default('all'),
  q: z.string().trim().max(100).optional(),
  skills: z.string().trim().max(200).optional(),
  department: z.string().trim().max(100).optional(),
  course: z.string().trim().max(100).optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  researchDomain: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createAvailabilitySlotSchema = z
  .object({
    startTime: z.coerce
      .date({ required_error: 'Slot start time is required' })
      .refine((d) => !isNaN(d.getTime()), 'Invalid start time format')
      .refine((d) => d.getTime() > Date.now(), 'Slot start time must be in the future'),
    endTime: z.coerce
      .date({ required_error: 'Slot end time is required' })
      .refine((d) => !isNaN(d.getTime()), 'Invalid end time format'),
    durationMinutes: z.number().int().min(10).max(120).optional(),
    locationType: z.enum(['CABIN', 'VIRTUAL_MEET']).optional().default('CABIN'),
    locationDetails: z.string().trim().max(200, 'Location details too long').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endTime.getTime() <= data.startTime.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'End time must be after start time',
      });
    }

    const durationCalc = Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60));
    if (durationCalc < 10 || durationCalc > 180) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: `Slot duration (${durationCalc} minutes) must be between 10 and 180 minutes`,
      });
    }

    // Maximum advance booking horizon: 60 days
    const maxHorizon = Date.now() + 60 * 24 * 60 * 60 * 1000;
    if (data.startTime.getTime() > maxHorizon) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startTime'],
        message: 'Slot cannot be scheduled more than 60 days in advance',
      });
    }
  });

export const updateAvailabilitySlotSchema = z
  .object({
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    durationMinutes: z.number().int().min(10).max(120).optional(),
    locationType: z.enum(['CABIN', 'VIRTUAL_MEET']).optional(),
    locationDetails: z.string().trim().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.startTime.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startTime'],
        message: 'Updated slot start time must be in the future',
      });
    }
    if (data.startTime && data.endTime && data.endTime.getTime() <= data.startTime.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'End time must be after start time',
      });
    }
  });

export const bookAppointmentSchema = z.object({
  slotId: z
    .string({ required_error: 'Availability slot ID is required' })
    .regex(objectIdRegex, 'Invalid slot ID format'),
  agenda: z
    .string({ required_error: 'Discussion agenda is required' })
    .trim()
    .min(10, 'Agenda must be at least 10 characters describing the consultation purpose')
    .max(500, 'Agenda cannot exceed 500 characters'),
});

export const rejectAppointmentSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .max(300, 'Rejection reason cannot exceed 300 characters')
    .optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(300, 'Cancellation reason cannot exceed 300 characters')
    .optional(),
});

export const completeAppointmentSchema = z.object({
  teacherNotes: z
    .string()
    .trim()
    .max(1000, 'Teacher notes cannot exceed 1000 characters')
    .optional(),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const updateMeetingDetailsSchema = z
  .object({
    meetingMode: z.enum(['ONLINE', 'IN_PERSON'], {
      required_error: 'Meeting mode is required (ONLINE or IN_PERSON)',
    }),
    meetingLink: z
      .string()
      .trim()
      .max(500, 'Meeting link cannot exceed 500 characters')
      .optional()
      .or(z.literal('')),
    meetingInstructions: z
      .string()
      .trim()
      .max(1000, 'Meeting instructions cannot exceed 1000 characters')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.meetingMode === 'ONLINE' && data.meetingLink && data.meetingLink.trim().length > 0) {
      if (!data.meetingLink.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meetingLink'],
          message: 'Meeting link must use a secure HTTPS protocol (e.g. https://meet.google.com/...)',
        });
      }
      try {
        new URL(data.meetingLink);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['meetingLink'],
          message: 'Meeting link must be a valid URL',
        });
      }
    }
  });

export const createRescheduleProposalSchema = z.object({
  proposedSlotId: z
    .string({ required_error: 'Proposed slot ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid slot ID format'),
  reason: z
    .string()
    .trim()
    .max(500, 'Rescheduling reason cannot exceed 500 characters')
    .optional(),
});

export const rejectRescheduleProposalSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, 'Rejection reason cannot exceed 500 characters')
    .optional(),
});

export const updateAccountStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED'], {
    required_error: 'Status must be ACTIVE, SUSPENDED, or DEACTIVATED',
  }),
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
});

export const verifyFacultySchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT'], {
    required_error: 'Decision must be either APPROVE or REJECT',
  }),
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
});

export const adminCancelAppointmentSchema = z.object({
  reason: z
    .string({ required_error: 'Administrative cancellation reason is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export const adminAnalyticsQuerySchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});

export const adminExportReportSchema = z.object({
  type: z.enum(['students', 'teachers', 'verifications', 'appointments', 'platform-summary'], {
    required_error: 'Report type is required',
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type TeacherProfileInput = z.infer<typeof teacherProfileSchema>;
export type DirectoryQueryInput = z.infer<typeof directoryQuerySchema>;
export type CreateAvailabilitySlotInput = z.infer<typeof createAvailabilitySlotSchema>;
export type UpdateAvailabilitySlotInput = z.infer<typeof updateAvailabilitySlotSchema>;
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type RejectAppointmentInput = z.infer<typeof rejectAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type CompleteAppointmentInput = z.infer<typeof completeAppointmentSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
export type UpdateMeetingDetailsInput = z.infer<typeof updateMeetingDetailsSchema>;
export type CreateRescheduleProposalInput = z.infer<typeof createRescheduleProposalSchema>;
export type RejectRescheduleProposalInput = z.infer<typeof rejectRescheduleProposalSchema>;
export type UpdateAccountStatusInput = z.infer<typeof updateAccountStatusSchema>;
export type VerifyFacultyInput = z.infer<typeof verifyFacultySchema>;
export type AdminCancelAppointmentInput = z.infer<typeof adminCancelAppointmentSchema>;
export type AdminAnalyticsQueryInput = z.infer<typeof adminAnalyticsQuerySchema>;
export type AdminExportReportInput = z.infer<typeof adminExportReportSchema>;

