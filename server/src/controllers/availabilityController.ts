import { Request, Response, NextFunction } from 'express';
import { availabilityService } from '../services/availabilityService';
import {
  createAvailabilitySlotSchema,
  updateAvailabilitySlotSchema,
} from '../utils/validators';

export class AvailabilityController {
  /**
   * POST /api/v1/availability
   * Teacher creates a new consultation slot.
   */
  async createSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createAvailabilitySlotSchema.parse(req.body);
      const slot = await availabilityService.createSlot(req.user!.id, validatedData);

      res.status(201).json({
        success: true,
        message: 'Consultation availability slot created successfully.',
        data: { slot },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/availability/mine
   * Authenticated teacher lists their own availability slots.
   */
  async getMySlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        from: req.query.from as string,
        to: req.query.to as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await availabilityService.getMySlots(req.user!.id, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/availability/teacher/:teacherProfileId
   * Public / student query for upcoming available consultation slots for a faculty member.
   */
  async getTeacherPublicSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherProfileId = req.params.teacherProfileId;
      const filters = {
        from: req.query.from as string,
        to: req.query.to as string,
      };

      const slots = await availabilityService.getTeacherPublicSlots(teacherProfileId, filters);

      res.status(200).json({
        success: true,
        data: { slots },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/availability/:slotId
   * Teacher updates an existing unbooked slot.
   */
  async updateSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slotId = req.params.slotId;
      const validatedData = updateAvailabilitySlotSchema.parse(req.body);

      const slot = await availabilityService.updateSlot(req.user!.id, slotId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Consultation slot updated successfully.',
        data: { slot },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/availability/:slotId
   * Teacher cancels or deletes an unbooked slot.
   */
  async deleteSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slotId = req.params.slotId;
      await availabilityService.deleteSlot(req.user!.id, slotId);

      res.status(200).json({
        success: true,
        message: 'Consultation slot cancelled successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();
