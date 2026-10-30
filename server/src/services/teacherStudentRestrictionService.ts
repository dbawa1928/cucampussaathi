import { Types } from 'mongoose';
import { TeacherStudentRestriction, ITeacherStudentRestriction } from '../models/TeacherStudentRestriction';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';
import { AppError } from '../utils/errors';
import { notificationService } from './notificationService';
import { emailService } from './emailService';
import { auditService } from './auditService';
import { logger } from '../utils/logger';

export interface BlockedStudentSummary {
  restrictionId: string;
  student: {
    _id: string;
    fullName: string;
    email: string;
    uid: string;
    department: string;
  };
  totalAppointmentsWithTeacher: number;
  consultationCount?: number;
  attendedCount: number;
  noShowCount: number;
  reason: string;
  notes?: string;
  blockedAt: Date;
  isActive: boolean;
}

export class TeacherStudentRestrictionService {
  /**
   * Block a student from booking consultations with a specific teacher.
   */
  async blockStudent(
    teacherUserId: string,
    studentUserId: string,
    reason: string,
    notes?: string
  ): Promise<ITeacherStudentRestriction> {
    if (teacherUserId === studentUserId) {
      throw new AppError('Teachers cannot block themselves.', 400);
    }

    const [teacher, student] = await Promise.all([
      User.findById(teacherUserId),
      User.findById(studentUserId),
    ]);

    if (!teacher || teacher.role !== 'TEACHER') {
      throw new AppError('Only faculty members can manage student booking restrictions.', 403);
    }

    if (!student || student.role !== 'STUDENT') {
      throw new AppError('Target user must be a registered campus student.', 404);
    }

    // Check if an active restriction already exists
    const existing = await TeacherStudentRestriction.findOne({
      teacher: teacher._id,
      student: student._id,
      isActive: true,
    });

    if (existing) {
      throw new AppError('This student is already restricted from booking appointments with you.', 409);
    }

    const restriction = await TeacherStudentRestriction.create({
      teacher: teacher._id,
      student: student._id,
      isActive: true,
      reason: reason.trim(),
      notes: notes?.trim(),
      blockedAt: new Date(),
      blockedBy: teacher._id,
    });

    logger.info(
      `[RESTRICTION] Teacher ${teacher.fullName} (${teacher._id}) blocked Student ${student.fullName} (${student._id})`
    );

    // 1. In-app Notification for student
    try {
      await notificationService.createNotification({
        recipient: student._id.toString(),
        type: 'APPOINTMENT_CANCELLED',
        title: 'Booking Notice: Faculty Consultation Restriction',
        message: `Prof. ${teacher.fullName} has restricted new consultation bookings with you. Reason: ${reason}. You can still book with other faculty members.`,
        metadata: {
          teacherId: teacher._id.toString(),
          restrictionId: restriction._id.toString(),
        },
      });
    } catch (err) {
      logger.error('Failed to dispatch in-app block notification:', err);
    }

    // 2. Email Notification for student
    try {
      await emailService.sendStudentBlockedEmail({
        studentEmail: student.email,
        studentName: student.fullName,
        teacherName: teacher.fullName,
        reason,
      });
    } catch (err) {
      logger.error('Failed to send student blocked email:', err);
    }

    // 3. Audit trail
    try {
      await auditService.logAdminAction({
        adminId: teacher._id.toString(),
        action: 'TEACHER_SUSPENDED' as any,
        targetUserId: student._id.toString(),
        entityType: 'USER',
        reason: `Teacher-level booking restriction applied by ${teacher.fullName}: ${reason}`,
      });
    } catch (err) {
      logger.error('Failed to log restriction audit event:', err);
    }

    return restriction;
  }

  /**
   * Unblock a student to restore booking privileges with this teacher.
   */
  async unblockStudent(
    teacherUserId: string,
    studentUserId: string,
    unblockedByUserId: string,
    unblockReason?: string,
    isAdminOverride = false
  ): Promise<ITeacherStudentRestriction> {
    const restriction = await TeacherStudentRestriction.findOne({
      teacher: new Types.ObjectId(teacherUserId),
      student: new Types.ObjectId(studentUserId),
      isActive: true,
    });

    if (!restriction) {
      throw new AppError('No active restriction found between this faculty member and student.', 404);
    }

    // Authorization check: Must be the teacher who blocked, or an ADMIN
    if (!isAdminOverride && teacherUserId !== unblockedByUserId) {
      throw new AppError('You are not authorized to unblock students for another faculty member.', 403);
    }

    restriction.isActive = false;
    restriction.unblockedAt = new Date();
    restriction.unblockedBy = new Types.ObjectId(unblockedByUserId);
    if (unblockReason) {
      restriction.unblockReason = unblockReason.trim();
    }
    await restriction.save();

    const [teacher, student] = await Promise.all([
      User.findById(teacherUserId),
      User.findById(studentUserId),
    ]);

    logger.info(
      `[RESTRICTION] Student ${student?.fullName} (${studentUserId}) unblocked for Teacher ${teacher?.fullName} (${teacherUserId})`
    );

    // In-app Notification for student
    if (student && teacher) {
      try {
        await notificationService.createNotification({
          recipient: student._id.toString(),
          type: 'APPOINTMENT_ACCEPTED',
          title: 'Booking Restored: Faculty Consultation Available',
          message: `Your booking access with Prof. ${teacher.fullName} has been restored. You may now book available consultation slots.`,
          metadata: {
            teacherId: teacher._id.toString(),
            restrictionId: restriction._id.toString(),
          },
        });
      } catch (err) {
        logger.error('Failed to dispatch unblock notification:', err);
      }

      // Email Notification
      try {
        await emailService.sendStudentUnblockedEmail({
          studentEmail: student.email,
          studentName: student.fullName,
          teacherName: teacher.fullName,
          unblockReason,
        });
      } catch (err) {
        logger.error('Failed to send student unblock email:', err);
      }
    }

    return restriction;
  }

  /**
   * Check if a student is actively blocked by a specific teacher.
   */
  async isStudentBlockedByTeacher(
    teacherUserId: string,
    studentUserId: string
  ): Promise<boolean> {
    const count = await TeacherStudentRestriction.countDocuments({
      teacher: new Types.ObjectId(teacherUserId),
      student: new Types.ObjectId(studentUserId),
      isActive: true,
    });
    return count > 0;
  }

  /**
   * Retrieve active restriction details if present.
   */
  async getActiveRestriction(
    teacherUserId: string,
    studentUserId: string
  ): Promise<ITeacherStudentRestriction | null> {
    return TeacherStudentRestriction.findOne({
      teacher: new Types.ObjectId(teacherUserId),
      student: new Types.ObjectId(studentUserId),
      isActive: true,
    });
  }

  /**
   * List all blocked students for a teacher with attendance metrics.
   */
  async listBlockedStudentsForTeacher(
    teacherUserId: string
  ): Promise<BlockedStudentSummary[]> {
    const restrictions = await TeacherStudentRestriction.find({
      teacher: new Types.ObjectId(teacherUserId),
      isActive: true,
    })
      .populate<{ student: any }>('student', 'fullName email uid department')
      .sort({ blockedAt: -1 });

    const results: BlockedStudentSummary[] = [];

    for (const res of restrictions) {
      if (!res.student) continue;

      // Calculate consultation attendance metrics with this teacher
      const [totalAppts, attendedCount, noShowCount] = await Promise.all([
        Appointment.countDocuments({
          student: res.student._id,
        }),
        Appointment.countDocuments({
          student: res.student._id,
          attendanceStatus: 'ATTENDED',
        }),
        Appointment.countDocuments({
          student: res.student._id,
          attendanceStatus: 'NO_SHOW',
        }),
      ]);

      results.push({
        restrictionId: res._id.toString(),
        student: {
          _id: res.student._id.toString(),
          fullName: res.student.fullName,
          email: res.student.email,
          uid: res.student.uid,
          department: res.student.department,
        },
        totalAppointmentsWithTeacher: totalAppts,
        consultationCount: totalAppts,
        attendedCount,
        noShowCount,
        reason: res.reason,
        notes: res.notes,
        blockedAt: res.blockedAt,
        isActive: res.isActive,
      });
    }

    return results;
  }

  /**
   * Admin view: list all restrictions across campus.
   */
  async listAllRestrictionsForAdmin(filters: {
    isActive?: boolean;
    teacherId?: string;
    studentId?: string;
  } = {}) {
    const query: any = {};
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.teacherId) query.teacher = new Types.ObjectId(filters.teacherId);
    if (filters.studentId) query.student = new Types.ObjectId(filters.studentId);

    return TeacherStudentRestriction.find(query)
      .populate('teacher', 'fullName email uid department')
      .populate('student', 'fullName email uid department')
      .populate('blockedBy', 'fullName email')
      .populate('unblockedBy', 'fullName email')
      .sort({ createdAt: -1 });
  }
}

export const teacherStudentRestrictionService = new TeacherStudentRestrictionService();
