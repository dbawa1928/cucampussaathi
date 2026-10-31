import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { teacherRestrictionController } from '../controllers/teacherRestrictionController';
import { authGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

// Protect ALL admin routes with both authentication and ADMIN role requirement
router.use(authGuard);
router.use(roleGuard('ADMIN'));

// 1. Overview & Analytics
router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));
router.get('/analytics', (req, res, next) => adminController.getAnalytics(req, res, next));
router.get('/search', (req, res, next) => adminController.globalSearch(req, res, next));

// 2. Universal User Management
router.get('/users', (req, res, next) => adminController.listAllUsers(req, res, next));
router.get('/users/:id', (req, res, next) => adminController.getUser360(req, res, next));
router.patch('/users/:id/status', (req, res, next) => adminController.updateUniversalUserStatus(req, res, next));
router.patch('/users/:id/notes', (req, res, next) => adminController.updateUserAdminNotes(req, res, next));

// 3. Student Management (Dedicated endpoints for backward compatibility)
router.get('/students', (req, res, next) => adminController.listStudents(req, res, next));
router.get('/students/:id', (req, res, next) => adminController.getStudentById(req, res, next));
router.patch('/students/:id/status', (req, res, next) => adminController.updateStudentStatus(req, res, next));

// 4. Faculty Management & Verification
router.get('/teachers', (req, res, next) => adminController.listTeachers(req, res, next));
router.get('/teachers/:id', (req, res, next) => adminController.getTeacherById(req, res, next));
router.patch('/teachers/:id/status', (req, res, next) => adminController.updateTeacherStatus(req, res, next));
router.get('/verifications', (req, res, next) => adminController.listVerifications(req, res, next));
router.post('/verifications/:id', (req, res, next) => adminController.verifyFaculty(req, res, next));

// 5. FacultyConnect Appointments & Attendance Oversight
router.get('/appointments', (req, res, next) => adminController.listAppointments(req, res, next));
router.get('/appointments/:id', (req, res, next) => adminController.getAppointmentById(req, res, next));
router.post('/appointments/:id/cancel', (req, res, next) => adminController.cancelAppointment(req, res, next));
router.get('/attendance', (req, res, next) => adminController.getAttendanceAndAppeals(req, res, next));
router.post('/appointments/:id/review-appeal', (req, res, next) => adminController.reviewAppointmentAppeal(req, res, next));

// 6. Teacher-Student Restrictions Management
router.get('/restrictions', (req, res) => teacherRestrictionController.adminListRestrictions(req, res));
router.post('/restrictions/:id/override', (req, res) => teacherRestrictionController.adminOverrideRestriction(req, res));

// 7. Learn & Teach Network Moderation
router.get('/learn-teach', (req, res, next) => adminController.listLearnTeachAdministration(req, res, next));
router.post('/learn-teach/listings/:id/moderate', (req, res, next) => adminController.moderateTeachingListing(req, res, next));
router.post('/learn-teach/reports/:id/resolve', (req, res, next) => adminController.resolveLearnTeachReport(req, res, next));

// 8. Campus Events Calendar Moderation
router.get('/events', (req, res, next) => adminController.listCampusEvents(req, res, next));
router.post('/events/:id/moderate', (req, res, next) => adminController.moderateCampusEvent(req, res, next));

// 9. Communication & Contact Messages
router.get('/contact-messages', (req, res, next) => adminController.listContactMessages(req, res, next));
router.patch('/contact-messages/:id', (req, res, next) => adminController.updateContactMessage(req, res, next));

// 10. Platform Settings
router.get('/settings', (req, res, next) => adminController.getPlatformSettings(req, res, next));
router.patch('/settings', (req, res, next) => adminController.updatePlatformSettings(req, res, next));

// 11. Reports & Data Export (CSV)
router.get('/reports', (req, res, next) => adminController.exportReport(req, res, next));

// 12. Admin Activity Logs
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));

export { router as adminRouter };
