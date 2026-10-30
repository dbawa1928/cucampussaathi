import { z } from 'zod';

export const createTeachingListingSchema = z.object({
  skillName: z.string().min(2).max(100),
  category: z.string().min(2).max(100),
  expertiseLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  experienceMonths: z.number().min(0).default(0),
  description: z.string().min(10).max(1000),
  teachingMode: z.enum(['ONLINE', 'OFFLINE', 'BOTH']).default('BOTH'),
  teachingType: z.enum(['INDIVIDUAL', 'GROUP', 'BOTH']).default('BOTH'),
  languages: z.array(z.string()).default(['English', 'Hindi']),
  days: z.array(z.string()).optional(),
  timeSlots: z.array(z.string()).optional(),
  maxLearners: z.number().min(1).max(50).default(5),
  preferredSchedule: z.string().max(200).optional(),
  proofUrl: z.string().max(500).optional(),
});

export const updateTeachingListingSchema = z.object({
  expertiseLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  experienceMonths: z.number().min(0).optional(),
  description: z.string().min(10).max(1000).optional(),
  teachingMode: z.enum(['ONLINE', 'OFFLINE', 'BOTH']).optional(),
  teachingType: z.enum(['INDIVIDUAL', 'GROUP', 'BOTH']).optional(),
  languages: z.array(z.string()).optional(),
  availability: z
    .object({
      days: z.array(z.string()).optional(),
      timeSlots: z.array(z.string()).optional(),
    })
    .optional(),
  maxLearners: z.number().min(1).max(50).optional(),
  preferredSchedule: z.string().max(200).optional(),
  proofUrl: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'DELETED']).optional(),
});

export const createLearningGoalSchema = z.object({
  skillName: z.string().min(2).max(100),
  category: z.string().min(2).max(100),
  currentLevel: z.enum(['BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  targetLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('INTERMEDIATE'),
  learningObjective: z.string().min(10).max(1000),
  preferredMode: z.enum(['ONLINE', 'OFFLINE', 'BOTH']).default('BOTH'),
  preferredType: z.enum(['INDIVIDUAL', 'GROUP', 'BOTH']).default('BOTH'),
  preferredLanguages: z.array(z.string()).default(['English', 'Hindi']),
  availableDays: z.array(z.string()).default(['Saturday', 'Sunday']),
  preferredTime: z.string().max(100).optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  expectedDuration: z.string().max(100).optional(),
});

export const updateLearningGoalSchema = z.object({
  currentLevel: z.enum(['BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  targetLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  learningObjective: z.string().min(10).max(1000).optional(),
  preferredMode: z.enum(['ONLINE', 'OFFLINE', 'BOTH']).optional(),
  preferredType: z.enum(['INDIVIDUAL', 'GROUP', 'BOTH']).optional(),
  preferredLanguages: z.array(z.string()).optional(),
  availableDays: z.array(z.string()).optional(),
  preferredTime: z.string().max(100).optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  expectedDuration: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'DELETED']).optional(),
});

export const sendConnectionRequestSchema = z.object({
  receiverId: z.string().min(1),
  skillId: z.string().min(1),
  teachingListingId: z.string().optional(),
  learningGoalId: z.string().optional(),
  requestMessage: z.string().min(5).max(1000),
  learningObjective: z.string().max(1000).optional(),
  preferredMode: z.enum(['ONLINE', 'OFFLINE', 'BOTH']).default('BOTH'),
  preferredSchedule: z.string().max(200).optional(),
});

export const proposeSessionSchema = z.object({
  connectionId: z.string().min(1),
  sessionTitle: z.string().min(3).max(150),
  description: z.string().max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm'),
  endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm'),
  mode: z.enum(['ONLINE', 'OFFLINE']),
  meetingLink: z.string().url().optional().or(z.literal('')),
  location: z.string().max(200).optional(),
});

export const createLearningGroupSchema = z.object({
  skillName: z.string().min(2).max(100),
  category: z.string().min(2).max(100),
  name: z.string().min(3).max(120),
  description: z.string().min(10).max(1000),
  maxMembers: z.number().min(2).max(100).default(15),
  mode: z.enum(['ONLINE', 'OFFLINE', 'BOTH']).default('BOTH'),
  languages: z.array(z.string()).default(['English', 'Hindi']),
  schedule: z.string().max(200).optional(),
});

export const sendMessageSchema = z.object({
  connectionId: z.string().optional(),
  groupId: z.string().optional(),
  content: z.string().min(1).max(3000),
});

export const createReviewSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.number().min(1).max(5),
  feedback: z.string().min(5).max(1000),
});

export const submitReportSchema = z.object({
  targetType: z.enum(['USER', 'TEACHING_LISTING', 'LEARNING_GROUP', 'MESSAGE']),
  targetId: z.string().min(1),
  reportedUserId: z.string().optional(),
  reason: z.string().min(3).max(200),
  details: z.string().max(1000).optional(),
});
