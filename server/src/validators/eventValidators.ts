import { z } from 'zod';

export const eventCategoryEnum = z.enum([
  'Workshops',
  'Seminars',
  'Guest Lectures',
  'Webinars',
  'Hackathons',
  'Competitions',
  'Technical Events',
  'Cultural Events',
  'Sports Events',
  'Placement & Career Events',
  'Club Activities',
  'Faculty Events',
  'Other',
]);

export const eventModeEnum = z.enum(['ONLINE', 'OFFLINE']);
export const eventStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']);

export const speakerDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Speaker name cannot be empty').max(100),
  designation: z.string().trim().max(100).optional(),
  organization: z.string().trim().max(100).optional(),
});

export const createEventSchema = z
  .object({
    title: z.string().trim().min(3, 'Event title must be at least 3 characters').max(200),
    category: eventCategoryEnum,
    shortDescription: z.string().trim().min(10, 'Short description must be at least 10 characters').max(300),
    description: z.string().trim().min(20, 'Full description must be at least 20 characters'),
    bannerUrl: z.string().trim().url('Invalid banner URL').optional().or(z.literal('')),

    startDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid start date/time format',
    }),
    endDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end date/time format',
    }),
    timezone: z.string().default('Asia/Kolkata'),

    mode: eventModeEnum,
    campusBlock: z.string().trim().max(100).optional(),
    venue: z.string().trim().max(150).optional(),
    roomNumber: z.string().trim().max(50).optional(),
    onlinePlatform: z.string().trim().max(100).optional(),
    publicMeetingUrl: z.string().trim().url('Invalid meeting URL').optional().or(z.literal('')),

    organizerName: z.string().trim().min(2, 'Organizer name is required').max(150),
    organizerDepartment: z.string().trim().max(150).optional(),
    speakerDetails: speakerDetailsSchema.optional(),

    registrationEnabled: z.boolean().default(true),
    registrationUrl: z.string().trim().url('Invalid registration URL').optional().or(z.literal('')),
    registrationDeadline: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid registration deadline format',
    }),
    capacity: z.number().int().min(0, 'Capacity must be at least 0').default(0),

    contactEmail: z.string().trim().email('Invalid contact email').optional().or(z.literal('')),
    contactPhone: z.string().trim().max(20).optional().or(z.literal('')),
    additionalInstructions: z.string().trim().max(1000).optional(),

    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDateTime).getTime();
      const end = new Date(data.endDateTime).getTime();
      return end > start;
    },
    {
      message: 'Event end time must be after start time',
      path: ['endDateTime'],
    }
  )
  .refine(
    (data) => {
      if (data.mode === 'OFFLINE') {
        return !!(data.venue && data.venue.trim().length > 0);
      }
      return true;
    },
    {
      message: 'Venue is required for offline events',
      path: ['venue'],
    }
  );

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    category: eventCategoryEnum.optional(),
    shortDescription: z.string().trim().min(10).max(300).optional(),
    description: z.string().trim().min(20).optional(),
    bannerUrl: z.string().trim().url().optional().or(z.literal('')),

    startDateTime: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid start date/time format',
      }),
    endDateTime: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid end date/time format',
      }),
    timezone: z.string().optional(),

    mode: eventModeEnum.optional(),
    campusBlock: z.string().trim().max(100).optional(),
    venue: z.string().trim().max(150).optional(),
    roomNumber: z.string().trim().max(50).optional(),
    onlinePlatform: z.string().trim().max(100).optional(),
    publicMeetingUrl: z.string().trim().url().optional().or(z.literal('')),

    organizerName: z.string().trim().min(2).max(150).optional(),
    organizerDepartment: z.string().trim().max(150).optional(),
    speakerDetails: speakerDetailsSchema.optional(),

    registrationEnabled: z.boolean().optional(),
    registrationUrl: z.string().trim().url().optional().or(z.literal('')),
    registrationDeadline: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid registration deadline format',
    }),
    capacity: z.number().int().min(0).optional(),

    contactEmail: z.string().trim().email().optional().or(z.literal('')),
    contactPhone: z.string().trim().max(20).optional().or(z.literal('')),
    additionalInstructions: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.startDateTime && data.endDateTime) {
        return new Date(data.endDateTime).getTime() > new Date(data.startDateTime).getTime();
      }
      return true;
    },
    {
      message: 'Event end time must be after start time',
      path: ['endDateTime'],
    }
  );

export const cancelEventSchema = z.object({
  reason: z.string().trim().min(5, 'Cancellation reason must be at least 5 characters').max(500),
});

export const eventQuerySchema = z.object({
  category: z.string().optional(),
  mode: z.enum(['ONLINE', 'OFFLINE']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).optional(),
  timeframe: z.enum(['upcoming', 'today', 'this-week', 'past', 'all']).default('upcoming'),
  search: z.string().optional(),
  month: z.string().optional(), // YYYY-MM format
  page: z.string().regex(/^\d+$/).default('1').transform(Number),
  limit: z.string().regex(/^\d+$/).default('20').transform(Number),
});
