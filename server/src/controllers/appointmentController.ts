import { Request, Response, NextFunction } from 'express';
import { appointmentService } from '../services/appointmentService';
import {
  bookAppointmentSchema,
  rejectAppointmentSchema,
  cancelAppointmentSchema,
  completeAppointmentSchema,
  updateMeetingDetailsSchema,
} from '../utils/validators';
import { AppointmentStatus } from '../models/Appointment';

export class AppointmentController {
  /**
   * POST /api/v1/appointments
   * Student books an available consultation slot with required agenda.
   */
  async bookAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = bookAppointmentSchema.parse(req.body);
      const appointment = await appointmentService.bookAppointment(req.user!.id, validatedData);

      res.status(201).json({
        success: true,
        message: 'Appointment consultation request submitted successfully.',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/appointments/mine
   * Lists appointments for the authenticated caller (Student or Teacher).
   */
  async getMyAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        status: req.query.status as AppointmentStatus,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 15,
      };

      const result = await appointmentService.getMyAppointments(
        req.user!.id,
        req.user!.role,
        filters
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/appointments/:appointmentId
   * Retrieve appointment details with authorization verification.
   */
  async getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.appointmentId;
      const appointment = await appointmentService.getAppointmentById(
        req.user!.id,
        req.user!.role,
        appointmentId
      );

      res.status(200).json({
        success: true,
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/appointments/:appointmentId/accept
   * Teacher accepts a pending consultation request.
   */
  async acceptAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.appointmentId;
      const appointment = await appointmentService.acceptAppointment(req.user!.id, appointmentId);

      res.status(200).json({
        success: true,
        message: 'Consultation request accepted successfully.',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/appointments/:appointmentId/reject
   * Teacher rejects a pending consultation request with optional reason.
   */
  async rejectAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.appointmentId;
      const validatedData = rejectAppointmentSchema.parse(req.body);

      const appointment = await appointmentService.rejectAppointment(
        req.user!.id,
        appointmentId,
        validatedData.rejectionReason
      );

      res.status(200).json({
        success: true,
        message: 'Consultation request rejected and slot released.',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/appointments/:appointmentId/cancel
   * Student or assigned Teacher cancels an appointment and releases the slot.
   */
  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.appointmentId;
      const validatedData = cancelAppointmentSchema.parse(req.body);

      const appointment = await appointmentService.cancelAppointment(
        req.user!.id,
        req.user!.role,
        appointmentId,
        validatedData.reason
      );

      res.status(200).json({
        success: true,
        message: 'Consultation appointment cancelled successfully and slot released.',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/appointments/:appointmentId/complete
   * Teacher marks an accepted appointment as completed.
   */
  async completeAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.appointmentId;
      const validatedData = completeAppointmentSchema.parse(req.body);

      const appointment = await appointmentService.completeAppointment(
        req.user!.id,
        appointmentId,
        validatedData.teacherNotes
      );

      res.status(200).json({
        success: true,
        message: 'Consultation appointment marked as completed.',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/appointments/:appointmentId/meeting-details
   * Teacher or Admin updates meeting mode, meeting link, and instructions.
   */
  async updateMeetingDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = req.params.appointmentId;
      const validatedData = updateMeetingDetailsSchema.parse(req.body);

      const appointment = await appointmentService.updateMeetingDetails(
        req.user!.id,
        req.user!.role,
        appointmentId,
        validatedData
      );

      res.status(200).json({
        success: true,
        message: 'Meeting details updated successfully.',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const appointmentController = new AppointmentController();
