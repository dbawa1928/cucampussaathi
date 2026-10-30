import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

// Protect ALL admin routes with both authentication and ADMIN role requirement
router.use(authGuard);
router.use(roleGuard('ADMIN'));

// 1. Overview & Analytics
router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));
router.get('/analytics', (req, res, next) => adminController.getAnalytics(req, res, next));

// 2. Student Management
router.get('/students', (req, res, next) => adminController.listStudents(req, res, next));
router.get('/students/:id', (req, res, next) => adminController.getStudentById(req, res, next));
router.patch('/students/:id/status', (req, res, next) => adminController.updateStudentStatus(req, res, next));

// 3. Faculty Management
router.get('/teachers', (req, res, next) => adminController.listTeachers(req, res, next));
router.get('/teachers/:id', (req, res, next) => adminController.getTeacherById(req, res, next));
router.patch('/teachers/:id/status', (req, res, next) => adminController.updateTeacherStatus(req, res, next));

// 4. Faculty Verification Workflow
router.get('/verifications', (req, res, next) => adminController.listVerifications(req, res, next));
router.post('/verifications/:id', (req, res, next) => adminController.verifyFaculty(req, res, next));

// 5. Campus Appointment Monitoring
router.get('/appointments', (req, res, next) => adminController.listAppointments(req, res, next));
router.get('/appointments/:id', (req, res, next) => adminController.getAppointmentById(req, res, next));
router.post('/appointments/:id/cancel', (req, res, next) => adminController.cancelAppointment(req, res, next));

// 6. Reports & Data Export (CSV)
router.get('/reports', (req, res, next) => adminController.exportReport(req, res, next));

// 7. Admin Activity Logs
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));

export { router as adminRouter };
