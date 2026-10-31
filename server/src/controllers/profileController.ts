import { Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profileService';
import { studentProfileSchema, teacherProfileSchema } from '../utils/validators';

export class ProfileController {
  /**
   * GET /api/v1/users/profile/student
   */
  async getStudentProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await profileService.getStudentProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/profile/student
   */
  async updateStudentProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = studentProfileSchema.parse(req.body);
      const result = await profileService.upsertStudentProfile(req.user!.id, validatedData);
      res.status(200).json({
        success: true,
        message: 'Student profile updated successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/profile/teacher
   */
  async getTeacherProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await profileService.getTeacherProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/profile/teacher
   */
  async updateTeacherProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = teacherProfileSchema.parse(req.body);
      const result = await profileService.upsertTeacherProfile(req.user!.id, validatedData);
      res.status(200).json({
        success: true,
        message: 'Teacher profile updated successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/profile/teacher/cabin-status
   */
  async updateCabinStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, note } = req.body;
      const profile = await profileService.updateCabinStatus(req.user!.id, status, note);
      res.status(200).json({
        success: true,
        message: 'Cabin availability status updated successfully.',
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
