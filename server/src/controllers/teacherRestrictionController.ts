import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { teacherStudentRestrictionService } from '../services/teacherStudentRestrictionService';
import { TeacherStudentRestriction } from '../models/TeacherStudentRestriction';
import { blockStudentSchema } from '../utils/validators';
import { AppError } from '../utils/errors';

export class TeacherRestrictionController {
  /**
   * POST /api/v1/teachers/restrictions/block
   * Faculty blocks a student from booking consultations.
   */
  async blockStudent(req: Request, res: Response): Promise<void> {
    const validatedData = blockStudentSchema.parse(req.body);
    const teacherUserId = req.user!._id.toString();

    const restriction = await teacherStudentRestrictionService.blockStudent(
      teacherUserId,
      validatedData.studentId,
      validatedData.reason,
      validatedData.notes
    );

    res.status(201).json({
      success: true,
      message: 'Student successfully restricted from booking consultations with you.',
      data: { restriction },
    });
  }

  /**
   * POST /api/v1/teachers/restrictions/unblock/:studentId
   * Faculty unblocks a student.
   */
  async unblockStudent(req: Request, res: Response): Promise<void> {
    const studentId = req.params.studentId || req.body.studentId;
    const unblockReason = req.body.unblockReason || req.body.reason || 'Booking access restored by faculty member';
    const teacherUserId = req.user!._id.toString();

    if (!studentId) {
      throw new AppError('Student identifier is required.', 400);
    }

    const restriction = await teacherStudentRestrictionService.unblockStudent(
      teacherUserId,
      studentId,
      teacherUserId,
      unblockReason,
      false
    );

    res.status(200).json({
      success: true,
      message: 'Student booking access restored successfully.',
      data: { restriction },
    });
  }

  /**
   * GET /api/v1/teachers/restrictions/blocked
   * List all currently blocked students for authenticated teacher.
   */
  async getBlockedStudents(req: Request, res: Response): Promise<void> {
    const teacherUserId = req.user!._id.toString();
    const blockedStudents = await teacherStudentRestrictionService.listBlockedStudentsForTeacher(
      teacherUserId
    );

    res.status(200).json({
      success: true,
      data: {
        blockedStudents,
        restrictions: blockedStudents,
      },
    });
  }

  /**
   * GET /api/v1/teachers/restrictions/check/:teacherId
   * Student or frontend checks if the authenticated student is blocked by target teacher.
   */
  async checkRestriction(req: Request, res: Response): Promise<void> {
    const studentUserId = req.user!._id.toString();
    const { teacherId } = req.params;

    if (!teacherId) {
      throw new AppError('Teacher identifier is required.', 400);
    }

    const isBlocked = await teacherStudentRestrictionService.isStudentBlockedByTeacher(
      teacherId,
      studentUserId
    );

    let reason: string | undefined;
    if (isBlocked) {
      const active = await teacherStudentRestrictionService.getActiveRestriction(
        teacherId,
        studentUserId
      );
      reason = active?.reason;
    }

    res.status(200).json({
      success: true,
      data: {
        isBlocked,
        reason,
      },
    });
  }

  /**
   * GET /api/v1/admin/restrictions
   * Admin lists all restrictions platform-wide.
   */
  async adminListRestrictions(req: Request, res: Response): Promise<void> {
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const teacherId = req.query.teacherId as string | undefined;
    const studentId = req.query.studentId as string | undefined;

    const restrictions = await teacherStudentRestrictionService.listAllRestrictionsForAdmin({
      isActive,
      teacherId,
      studentId,
    });

    res.status(200).json({
      success: true,
      data: {
        restrictions,
      },
    });
  }

  /**
   * POST /api/v1/admin/restrictions/:id/override
   * Admin overrides an inappropriate booking restriction.
   */
  async adminOverrideRestriction(req: Request, res: Response): Promise<void> {
    const adminUserId = req.user!._id.toString();
    const { reason } = req.body;
    let restriction = null;

    if (req.params.id && Types.ObjectId.isValid(req.params.id)) {
      restriction = await TeacherStudentRestriction.findById(req.params.id);
      if (restriction) {
        restriction.isActive = false;
        restriction.unblockedAt = new Date();
        restriction.unblockedBy = new Types.ObjectId(adminUserId);
        (restriction as any).unblockedByAdmin = true;
        if (reason) restriction.unblockReason = reason;
        await restriction.save();
      }
    }

    if (!restriction && req.body.teacherId && req.body.studentId) {
      restriction = await teacherStudentRestrictionService.unblockStudent(
        req.body.teacherId,
        req.body.studentId,
        adminUserId,
        reason || 'Administrative override',
        true
      );
    }

    if (!restriction) {
      throw new AppError('Restriction not found to override.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Restriction administratively overridden and booking restored.',
      data: { restriction },
    });
  }
}

export const teacherRestrictionController = new TeacherRestrictionController();
