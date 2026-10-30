import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';
import { auditService } from '../services/auditService';
import {
  updateAccountStatusSchema,
  verifyFacultySchema,
  adminCancelAppointmentSchema,
  adminAnalyticsQuerySchema,
  adminExportReportSchema,
} from '../utils/validators';
import { AppError } from '../utils/errors';

export class AdminController {
  /**
   * GET /api/v1/admin/dashboard
   */
  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await adminService.getDashboardOverview();
      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = adminAnalyticsQuerySchema.safeParse(req.query);
      const timeframe = parsed.success ? parsed.data.timeframe : '30d';
      const analytics = await adminService.getPlatformAnalytics(timeframe);
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/students
   */
  async listStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.listStudents({
        search: req.query.search as string,
        department: req.query.department as string,
        course: req.query.course as string,
        semester: req.query.semester ? Number(req.query.semester) : undefined,
        accountStatus: req.query.accountStatus as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/students/:id
   */
  async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentDetails = await adminService.getStudentDetails(req.params.id);
      res.status(200).json({
        success: true,
        data: studentDetails,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/students/:id/status
   */
  async updateStudentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateAccountStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.errors[0].message, 400);
      }

      await adminService.preventSelfLockout(req.params.id, req.user!._id.toString());

      const updated = await adminService.updateStudentStatus(
        req.params.id,
        parsed.data.status,
        parsed.data.reason,
        req.user!._id.toString(),
        req.ip
      );

      res.status(200).json({
        success: true,
        message: `Student account status updated to ${parsed.data.status}.`,
        data: { user: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/teachers
   */
  async listTeachers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.listTeachers({
        search: req.query.search as string,
        department: req.query.department as string,
        verificationStatus: req.query.verificationStatus as string,
        accountStatus: req.query.accountStatus as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/teachers/:id
   */
  async getTeacherById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherDetails = await adminService.getTeacherDetails(req.params.id);
      res.status(200).json({
        success: true,
        data: teacherDetails,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/teachers/:id/status
   */
  async updateTeacherStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateAccountStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.errors[0].message, 400);
      }

      await adminService.preventSelfLockout(req.params.id, req.user!._id.toString());

      const updated = await adminService.updateTeacherStatus(
        req.params.id,
        parsed.data.status,
        parsed.data.reason,
        req.user!._id.toString(),
        req.ip
      );

      res.status(200).json({
        success: true,
        message: `Faculty account status updated to ${parsed.data.status}.`,
        data: { user: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/verifications
   */
  async listVerifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.listVerifications({
        status: req.query.status as any,
        department: req.query.department as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/verifications/:id
   */
  async verifyFaculty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = verifyFacultySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.errors[0].message, 400);
      }

      const verified = await adminService.verifyFaculty(
        req.params.id,
        parsed.data.decision,
        parsed.data.reason,
        req.user!._id.toString(),
        req.ip
      );

      res.status(200).json({
        success: true,
        message: `Faculty verification ${parsed.data.decision.toLowerCase()}ed successfully.`,
        data: { profile: verified },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/appointments
   */
  async listAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.listAppointments({
        search: req.query.search as string,
        status: req.query.status as string,
        meetingMode: req.query.meetingMode as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/appointments/:id
   */
  async getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentDetails = await adminService.getAppointmentDetails(req.params.id);
      res.status(200).json({
        success: true,
        data: appointmentDetails,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/appointments/:id/cancel
   */
  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = adminCancelAppointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.errors[0].message, 400);
      }

      const cancelled = await adminService.cancelAppointmentAdmin(
        req.params.id,
        parsed.data.reason,
        req.user!._id.toString(),
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Appointment administratively cancelled and slot released.',
        data: { appointment: cancelled },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/reports
   */
  async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = adminExportReportSchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError(parsed.error.errors[0].message, 400);
      }

      const { filename, csv } = await adminService.exportReport(
        parsed.data.type,
        req.user!._id.toString(),
        req.ip
      );

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/audit-logs
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await auditService.getAuditLogs({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        adminId: req.query.adminId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
