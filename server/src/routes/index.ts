import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import directoryRoutes from './directoryRoutes';
import availabilityRoutes from './availabilityRoutes';
import appointmentRoutes from './appointmentRoutes';
import notificationRoutes from './notificationRoutes';
import rescheduleRoutes from './rescheduleRoutes';
import documentRoutes from './documentRoutes';
import aiTutorRoutes from './aiTutorRoutes';
import teacherRestrictionRoutes from './teacherRestrictionRoutes';
import contactRoutes from './contactRoutes';
import learnTeachRoutes from './learnTeachRoutes';
import eventRoutes from './eventRoutes';
import { adminRouter } from './adminRoutes';
import { authGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

// Health Check: /api/v1/health
router.use('/', healthRoutes);

// Public System Announcement: /api/v1/public/announcement
router.get('/public/announcement', async (_req, res, next) => {
  try {
    const { PlatformSetting } = await import('../models/PlatformSetting');
    const settings = await PlatformSetting.findOne().lean();
    res.status(200).json({
      success: true,
      data: {
        announcementBanner: settings?.announcementBanner || { enabled: false, message: '', type: 'INFO' },
        platformName: settings?.platformName || 'CUCampusSaathi',
        maintenanceMode: settings?.maintenanceMode || false,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Auth Endpoints: /api/v1/auth/*
router.use('/auth', authRoutes);

// Profile Management: /api/v1/users/profile/*
router.use('/users/profile', profileRoutes);

// Campus Directory & Search: /api/v1/directory
router.use('/directory', directoryRoutes);

// Faculty Availability: /api/v1/availability/*
router.use('/availability', availabilityRoutes);

// Faculty Student Restrictions: /api/v1/teachers/restrictions/* and alias /api/v1/teacher-restrictions/*
router.use('/teachers/restrictions', teacherRestrictionRoutes);
router.use('/teacher-restrictions', teacherRestrictionRoutes);

// Appointment Booking & Lifecycle: /api/v1/appointments/*
router.use('/appointments', appointmentRoutes);

// Notifications: /api/v1/notifications/*
router.use('/notifications', notificationRoutes);

// Reschedule Proposals: /api/v1/reschedule-proposals/*
router.use('/reschedule-proposals', rescheduleRoutes);

// AI Document Tutor & Documents: /api/v1/documents/* and /api/v1/ai/*
router.use('/documents', documentRoutes);
router.use('/ai', aiTutorRoutes);

// Learn & Teach Network: /api/v1/learn-teach/*
router.use('/learn-teach', learnTeachRoutes);

// Admin Dashboard & Campus Management: /api/v1/admin/*
router.use('/admin', adminRouter);

// Contact & Support: /api/v1/contact
router.use('/contact', contactRoutes);

// Campus Events Calendar: /api/v1/events/*
router.use('/events', eventRoutes);

// RBAC Test Endpoints (For automated and manual verification of roleGuard)
router.get('/test/student-only', authGuard, roleGuard('STUDENT'), (req, res) => {
  res.json({ success: true, message: 'Welcome to the Student protected area.', user: req.user?.email });
});

router.get('/test/teacher-only', authGuard, roleGuard('TEACHER'), (req, res) => {
  res.json({ success: true, message: 'Welcome to the Teacher protected area.', user: req.user?.email });
});

router.get('/test/admin-only', authGuard, roleGuard('ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Welcome to the Admin protected area.', user: req.user?.email });
});

export default router;
