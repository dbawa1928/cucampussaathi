import { Types } from 'mongoose';
import { Appointment, IAppointment, AppointmentStatus, AttendanceStatus } from '../models/Appointment';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { TeacherProfile } from '../models/TeacherProfile';
import { User } from '../models/User';
import { BookAppointmentInput, UpdateMeetingDetailsInput } from '../utils/validators';
import { notificationService } from './notificationService';
import { emailService } from './emailService';
import { teacherStudentRestrictionService } from './teacherStudentRestrictionService';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AppointmentService {
  /**
   * Book an available future slot with concurrency safeguards and teacher restriction checks.
   */
  async bookAppointment(
    studentUserId: string,
    data: BookAppointmentInput
  ): Promise<IAppointment> {
    const student = await User.findById(studentUserId);
    if (!student || student.role !== 'STUDENT') {
      throw new AppError('Only students can book consultation appointments.', 403);
    }

    const slotId = new Types.ObjectId(data.slotId);

    // 1. Fetch slot with teacher profile
    const slot = await AvailabilitySlot.findById(slotId).populate('teacherProfile');
    if (!slot) {
      throw new AppError('Consultation slot not found.', 404);
    }

    if (slot.status !== 'AVAILABLE' || slot.isBooked) {
      throw new AppError('This consultation slot is already reserved or unavailable.', 409);
    }

    if (new Date(slot.startTime).getTime() <= Date.now()) {
      throw new AppError('Cannot book a consultation slot in the past.', 400);
    }

    const teacherProfile = slot.teacherProfile as any;
    if (!teacherProfile) {
      throw new AppError('Faculty profile associated with this slot was not found.', 404);
    }

    const teacherUserId = (teacherProfile.user?._id || teacherProfile.user).toString();

    // 2. Prevent self-booking if the student is somehow linked to the teacher profile
    if (teacherUserId === studentUserId) {
      throw new AppError('You cannot book a consultation appointment with yourself.', 400);
    }

    // 3. CORE REQUIREMENT: Check Teacher-Student Restriction
    const isBlocked = await teacherStudentRestrictionService.isStudentBlockedByTeacher(
      teacherUserId,
      studentUserId
    );

    if (isBlocked) {
      const restriction = await teacherStudentRestrictionService.getActiveRestriction(
        teacherUserId,
        studentUserId
      );
      const err = new AppError(
        `This faculty member has restricted booking privileges for your account. Reason: ${
          restriction?.reason || 'Faculty restriction active'
        }. You may continue booking consultations with other faculty members.`,
        403
      );
      (err as any).code = 'TEACHER_BLOCKED_STUDENT';
      throw err;
    }

    // 4. Check faculty availability preference
    if (teacherProfile.isAcceptingBookings === false) {
      throw new AppError(
        'This faculty member is currently not accepting new consultation appointments.',
        400
      );
    }

    // 5. Enforce teacher daily booking capacity
    if (teacherProfile.maxDailySlots) {
      const slotStart = new Date(slot.startTime);
      const dayStart = new Date(Date.UTC(slotStart.getUTCFullYear(), slotStart.getUTCMonth(), slotStart.getUTCDate(), 0, 0, 0));
      const dayEnd = new Date(Date.UTC(slotStart.getUTCFullYear(), slotStart.getUTCMonth(), slotStart.getUTCDate(), 23, 59, 59));

      const dailyAppointmentsCount = await Appointment.countDocuments({
        teacherProfile: teacherProfile._id,
        status: { $in: ['PENDING', 'ACCEPTED'] },
        createdAt: { $gte: dayStart, $lte: dayEnd },
      });

      if (dailyAppointmentsCount >= teacherProfile.maxDailySlots) {
        throw new AppError(
          `This faculty member has reached their daily consultation limit (${teacherProfile.maxDailySlots} appointments). Please select another date.`,
          409
        );
      }
    }

    // 6. ATOMIC SLOT RESERVATION: Concurrency safeguard
    const reservedSlot = await AvailabilitySlot.findOneAndUpdate(
      {
        _id: slot._id,
        isBooked: false,
        status: 'AVAILABLE',
        startTime: { $gt: new Date() },
      },
      {
        $set: {
          isBooked: true,
          status: 'RESERVED',
        },
      },
      { new: true }
    );

    if (!reservedSlot) {
      throw new AppError(
        'This consultation slot was just reserved by another student. Please choose an alternate slot.',
        409
      );
    }

    // 7. Create appointment document
    try {
      const appointment = await Appointment.create({
        student: student._id,
        teacherProfile: teacherProfile._id,
        slot: slot._id,
        agenda: data.agenda.trim(),
        status: 'PENDING',
        meetingMode: data.meetingMode || 'IN_PERSON',
        campusBlock: data.campusBlock || teacherProfile.campusBlock,
        roomNumber: data.roomNumber || teacherProfile.roomNumber,
      });

      const slotTimeStr = new Date(slot.startTime).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      // Send in-app notification to the assigned teacher
      try {
        await notificationService.createNotification({
          recipient: teacherUserId,
          type: 'APPOINTMENT_BOOKED',
          title: 'New Consultation Request',
          message: `${student.fullName} has requested a consultation for ${slotTimeStr}.`,
          relatedAppointment: appointment._id,
        });
      } catch (notifErr) {
        logger.error('Failed to dispatch in-app booking notification:', notifErr);
      }

      // Send transactional email to the faculty member
      try {
        const teacherUser = await User.findById(teacherUserId);
        if (teacherUser) {
          const dateStr = new Date(slot.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' });
          const timeStr = new Date(slot.startTime).toLocaleTimeString('en-IN', { timeStyle: 'short' });
          await emailService.sendBookingRequestToFaculty({
            facultyEmail: teacherUser.email,
            facultyName: teacherUser.fullName,
            studentName: student.fullName,
            studentUid: student.uid,
            studentDepartment: student.department,
            appointmentDate: dateStr,
            appointmentTime: timeStr,
            meetingMode: appointment.meetingMode,
            agenda: appointment.agenda,
            appointmentId: appointment._id.toString(),
          });
        }
      } catch (emailErr) {
        logger.error('Failed to dispatch booking email to faculty:', emailErr);
      }

      return appointment;
    } catch (err: any) {
      // Rollback the slot reservation if appointment creation failed
      await AvailabilitySlot.updateOne(
        { _id: slot._id },
        { $set: { isBooked: false, status: 'AVAILABLE' } }
      );

      if (err.code === 11000) {
        throw new AppError(
          'An active booking already exists for this consultation slot.',
          409
        );
      }
      throw err;
    }
  }

  /**
   * List appointments for the authenticated caller (Student or Teacher).
   */
  async getMyAppointments(
    userId: string,
    role: string,
    filters: { status?: AppointmentStatus; page?: number; limit?: number }
  ): Promise<{
    appointments: IAppointment[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 15));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.status) {
      query.status = filters.status;
    }

    if (role === 'STUDENT') {
      query.student = userId;
    } else if (role === 'TEACHER') {
      const teacherProfile = await TeacherProfile.findOne({ user: userId });
      if (!teacherProfile) {
        return {
          appointments: [],
          pagination: { total: 0, page: 1, limit, totalPages: 1 },
        };
      }
      query.teacherProfile = teacherProfile._id;
    } else {
      throw new AppError('Unauthorized role for viewing personal appointments.', 403);
    }

    const [total, appointments] = await Promise.all([
      Appointment.countDocuments(query),
      Appointment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('slot')
        .populate({
          path: 'teacherProfile',
          populate: { path: 'user', select: 'fullName email department uid' },
        })
        .populate('student', 'fullName email department uid'),
    ]);

    return {
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve single appointment details with authorization check.
   */
  async getAppointmentById(
    userId: string,
    role: string,
    appointmentId: string
  ): Promise<IAppointment> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('slot')
      .populate({
        path: 'teacherProfile',
        populate: { path: 'user', select: 'fullName email department uid' },
      })
      .populate('student', 'fullName email department uid');

    if (!appointment) {
      throw new AppError('Appointment record not found.', 404);
    }

    const isStudentOwner = appointment.student._id.toString() === userId;
    const teacherUser = (appointment.teacherProfile as any)?.user;
    const isTeacherOwner = teacherUser && teacherUser._id.toString() === userId;
    const isAdmin = role === 'ADMIN';

    if (!isStudentOwner && !isTeacherOwner && !isAdmin) {
      throw new AppError('You are not authorized to access this appointment.', 403);
    }

    return appointment;
  }

  /**
   * Teacher action: Accept a pending appointment request.
   */
  async acceptAppointment(
    teacherUserId: string,
    appointmentId: string
  ): Promise<IAppointment> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('teacherProfile')
      .populate('slot')
      .populate('student');

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const teacherProfile = appointment.teacherProfile as any;
    if (!teacherProfile || teacherProfile.user.toString() !== teacherUserId) {
      throw new AppError('Only the assigned faculty member can accept this appointment.', 403);
    }

    if (appointment.status !== 'PENDING') {
      throw new AppError(
        `Cannot accept an appointment with status '${appointment.status}'. Only PENDING appointments can be accepted.`,
        400
      );
    }

    appointment.status = 'ACCEPTED';
    appointment.approvedAt = new Date();
    await appointment.save();

    // In-app notification to student
    try {
      await notificationService.createNotification({
        recipient: appointment.student._id.toString(),
        type: 'APPOINTMENT_ACCEPTED',
        title: 'Consultation Request Confirmed',
        message: 'Your faculty consultation request has been accepted.',
        relatedAppointment: appointment._id,
      });
    } catch {}

    // Transactional email to student
    try {
      const slot = appointment.slot as any;
      const student = appointment.student as any;
      const teacher = await User.findById(teacherUserId);
      if (student && slot && teacher) {
        const dateStr = new Date(slot.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' });
        const timeStr = new Date(slot.startTime).toLocaleTimeString('en-IN', { timeStyle: 'short' });
        const locationInfo = appointment.campusBlock ? `Block ${appointment.campusBlock}${appointment.roomNumber ? `, Room ${appointment.roomNumber}` : ''}` : undefined;
        await emailService.sendBookingApprovedToStudent({
          studentEmail: student.email,
          studentName: student.fullName,
          facultyName: teacher.fullName,
          appointmentDate: dateStr,
          appointmentTime: timeStr,
          meetingMode: appointment.meetingMode,
          locationInfo,
          meetingLink: appointment.meetingLink,
          appointmentId: appointment._id.toString(),
        });
      }
    } catch (err) {
      logger.error('Failed to send approval email to student:', err);
    }

    return appointment;
  }

  /**
   * Teacher action: Reject a pending appointment request and release the slot.
   */
  async rejectAppointment(
    teacherUserId: string,
    appointmentId: string,
    rejectionReason?: string
  ): Promise<IAppointment> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('teacherProfile')
      .populate('student');

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const teacherProfile = appointment.teacherProfile as any;
    if (!teacherProfile || teacherProfile.user.toString() !== teacherUserId) {
      throw new AppError('Only the assigned faculty member can reject this appointment.', 403);
    }

    if (appointment.status !== 'PENDING') {
      throw new AppError(
        `Cannot reject an appointment with status '${appointment.status}'. Only PENDING appointments can be rejected.`,
        400
      );
    }

    appointment.status = 'REJECTED';
    if (rejectionReason) {
      appointment.rejectionReason = rejectionReason;
    }
    await appointment.save();

    // Release slot back to AVAILABLE
    await AvailabilitySlot.updateOne(
      { _id: appointment.slot },
      { $set: { isBooked: false, status: 'AVAILABLE' } }
    );

    // In-app notification
    try {
      const reasonMsg = rejectionReason ? ` Reason: ${rejectionReason}` : '';
      await notificationService.createNotification({
        recipient: appointment.student._id.toString(),
        type: 'APPOINTMENT_REJECTED',
        title: 'Consultation Request Declined',
        message: `Your consultation request was declined by faculty.${reasonMsg}`,
        relatedAppointment: appointment._id,
      });
    } catch {}

    // Email to student
    try {
      const student = appointment.student as any;
      const teacher = await User.findById(teacherUserId);
      if (student && teacher) {
        await emailService.sendBookingRejectedToStudent({
          studentEmail: student.email,
          studentName: student.fullName,
          facultyName: teacher.fullName,
          rejectionReason: rejectionReason || 'Faculty unavailable at requested time.',
          appointmentId: appointment._id.toString(),
        });
      }
    } catch (err) {
      logger.error('Failed to send rejection email to student:', err);
    }

    return appointment;
  }

  /**
   * Cancel an appointment (accessible by student or assigned teacher).
   */
  async cancelAppointment(
    userId: string,
    role: string,
    appointmentId: string,
    reason?: string
  ): Promise<IAppointment> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('teacherProfile')
      .populate('slot')
      .populate('student');

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const isStudentOwner = appointment.student._id.toString() === userId;
    const teacherProfile = appointment.teacherProfile as any;
    const teacherUserId = (teacherProfile.user?._id || teacherProfile.user).toString();
    const isTeacherOwner = teacherUserId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isStudentOwner && !isTeacherOwner && !isAdmin) {
      throw new AppError('You are not authorized to cancel this appointment.', 403);
    }

    if (appointment.status !== 'PENDING' && appointment.status !== 'ACCEPTED') {
      throw new AppError(
        `Cannot cancel an appointment that is already ${appointment.status}.`,
        400
      );
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = new Types.ObjectId(userId);
    if (reason && !appointment.rejectionReason) {
      appointment.rejectionReason = reason;
    }
    await appointment.save();

    // Release slot
    await AvailabilitySlot.updateOne(
      { _id: appointment.slot },
      { $set: { isBooked: false, status: 'AVAILABLE' } }
    );

    // In-app notification
    try {
      const recipientId = isStudentOwner ? teacherUserId : appointment.student._id.toString();
      const cancelledByName = isStudentOwner ? 'The student' : 'The faculty member';
      const reasonMsg = reason ? ` Reason: ${reason}` : '';
      await notificationService.createNotification({
        recipient: recipientId,
        type: 'APPOINTMENT_CANCELLED',
        title: 'Consultation Cancelled',
        message: `${cancelledByName} cancelled the appointment.${reasonMsg}`,
        relatedAppointment: appointment._id,
      });
    } catch {}

    // Transactional email to the other party
    try {
      const slot = appointment.slot as any;
      const student = appointment.student as any;
      const teacher = await User.findById(teacherUserId);
      if (slot && student && teacher) {
        const dateStr = new Date(slot.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' });
        const timeStr = new Date(slot.startTime).toLocaleTimeString('en-IN', { timeStyle: 'short' });
        const targetEmail = isStudentOwner ? teacher.email : student.email;
        const targetName = isStudentOwner ? teacher.fullName : student.fullName;
        const actorName = isStudentOwner ? student.fullName : teacher.fullName;
        await emailService.sendBookingCancelledEmail({
          recipientEmail: targetEmail,
          recipientName: targetName,
          cancelledByName: actorName,
          reason,
          appointmentDate: dateStr,
          appointmentTime: timeStr,
          appointmentId: appointment._id.toString(),
        });
      }
    } catch (err) {
      logger.error('Failed to send cancellation email:', err);
    }

    return appointment;
  }

  /**
   * Complete an appointment with notes.
   */
  async completeAppointment(
    teacherUserId: string,
    appointmentId: string,
    teacherNotes?: string
  ): Promise<IAppointment> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId).populate('teacherProfile');
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const teacherProfile = appointment.teacherProfile as any;
    if (!teacherProfile || teacherProfile.user.toString() !== teacherUserId) {
      throw new AppError('Only the assigned faculty member can mark this appointment completed.', 403);
    }

    if (appointment.status !== 'ACCEPTED') {
      throw new AppError(
        `Only ACCEPTED appointments can be marked as COMPLETED. Current status: ${appointment.status}.`,
        400
      );
    }

    appointment.status = 'COMPLETED';
    if (appointment.attendanceStatus === 'NOT_MARKED') {
      appointment.attendanceStatus = 'ATTENDED';
      appointment.attendanceMarkedAt = new Date();
      appointment.attendanceMarkedBy = new Types.ObjectId(teacherUserId);
    }
    if (teacherNotes) {
      appointment.teacherNotes = teacherNotes;
    }
    await appointment.save();

    try {
      await notificationService.createNotification({
        recipient: appointment.student.toString(),
        type: 'APPOINTMENT_COMPLETED',
        title: 'Consultation Completed',
        message: 'Your faculty consultation has concluded. Check your appointment dashboard for teacher notes.',
        relatedAppointment: appointment._id,
      });
    } catch {}

    return appointment;
  }

  /**
   * Teacher action: Mark student attendance (ATTENDED or NO_SHOW).
   */
  async markAttendance(
    teacherUserId: string,
    appointmentId: string,
    attendanceStatus: AttendanceStatus,
    noShowReason?: string
  ): Promise<IAppointment> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('teacherProfile')
      .populate('slot')
      .populate('student');

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const teacherProfile = appointment.teacherProfile as any;
    if (!teacherProfile || teacherProfile.user.toString() !== teacherUserId) {
      throw new AppError('Only the assigned faculty member can mark consultation attendance.', 403);
    }

    if (appointment.status !== 'ACCEPTED' && appointment.status !== 'COMPLETED') {
      throw new AppError(
        `Cannot record attendance for appointment with status '${appointment.status}'. Must be ACCEPTED or COMPLETED.`,
        400
      );
    }

    appointment.attendanceStatus = attendanceStatus;
    appointment.attendanceMarkedAt = new Date();
    appointment.attendanceMarkedBy = new Types.ObjectId(teacherUserId);

    if (attendanceStatus === 'NO_SHOW') {
      appointment.noShowReason = noShowReason || 'Student did not arrive for scheduled consultation.';
    } else if (attendanceStatus === 'ATTENDED') {
      appointment.status = 'COMPLETED';
    }

    await appointment.save();

    // If marked NO_SHOW, notify student via in-app & email
    if (attendanceStatus === 'NO_SHOW') {
      const student = appointment.student as any;
      const teacher = await User.findById(teacherUserId);
      const slot = appointment.slot as any;

      try {
        await notificationService.createNotification({
          recipient: student._id.toString(),
          type: 'APPOINTMENT_CANCELLED',
          title: 'Attendance Notice: Marked No-Show',
          message: `Prof. ${teacher?.fullName || 'Faculty'} marked your appointment as No-Show. Reason: ${appointment.noShowReason}`,
          relatedAppointment: appointment._id,
        });
      } catch {}

      if (student && teacher && slot) {
        try {
          const dateStr = new Date(slot.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' });
          await emailService.sendStudentNoShowEmail({
            studentEmail: student.email,
            studentName: student.fullName,
            facultyName: teacher.fullName,
            appointmentDate: dateStr,
            noShowReason: appointment.noShowReason || 'Did not arrive for scheduled slot',
            appointmentId: appointment._id.toString(),
          });
        } catch (emailErr) {
          logger.error('Failed to send no-show email to student:', emailErr);
        }
      }
    }

    return appointment;
  }

  /**
   * Student action: Submit an appeal / explanation for a no-show mark.
   */
  async appealNoShow(
    studentUserId: string,
    appointmentId: string,
    reason: string
  ): Promise<IAppointment> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    if (appointment.student.toString() !== studentUserId) {
      throw new AppError('You can only submit an appeal for your own appointments.', 403);
    }

    if (appointment.attendanceStatus !== 'NO_SHOW') {
      throw new AppError('Appeals can only be submitted for appointments marked as NO_SHOW.', 400);
    }

    appointment.noShowAppeal = {
      appealedAt: new Date(),
      reason: reason.trim(),
      status: 'PENDING',
    };

    await appointment.save();
    return appointment;
  }

  /**
   * Admin action: Review a student's no-show appeal.
   */
  async reviewNoShowAppeal(
    adminUserId: string,
    appointmentId: string,
    decision: 'RESOLVE' | 'REJECT',
    notes?: string
  ): Promise<IAppointment> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId).populate('student');
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    if (!appointment.noShowAppeal) {
      throw new AppError('No appeal has been submitted for this appointment.', 404);
    }

    appointment.noShowAppeal.status = decision === 'RESOLVE' ? 'RESOLVED' : 'REJECTED';
    appointment.noShowAppeal.resolvedAt = new Date();
    appointment.noShowAppeal.resolvedBy = new Types.ObjectId(adminUserId);
    if (notes) {
      appointment.noShowAppeal.adminReviewNotes = notes.trim();
    }

    if (decision === 'RESOLVE') {
      // Restore attendance status so it does not count negatively against student
      appointment.attendanceStatus = 'ATTENDED';
    }

    await appointment.save();

    // In-app notification to student
    try {
      const studentId = (appointment.student as any)?._id || appointment.student;
      await notificationService.createNotification({
        recipient: studentId.toString(),
        type: 'APPOINTMENT_ACCEPTED',
        title: `No-Show Appeal ${decision === 'RESOLVE' ? 'Approved' : 'Declined'}`,
        message: `Administration has reviewed your no-show appeal: ${decision === 'RESOLVE' ? 'Your record has been cleared.' : 'The no-show record remains.'}`,
        relatedAppointment: appointment._id,
      });
    } catch {}

    return appointment;
  }

  /**
   * Student Attendance History with summary metrics.
   */
  async getStudentAttendanceHistory(studentUserId: string) {
    const appointments = await Appointment.find({
      student: new Types.ObjectId(studentUserId),
      attendanceStatus: { $in: ['ATTENDED', 'NO_SHOW'] },
    })
      .populate('slot')
      .populate({
        path: 'teacherProfile',
        populate: { path: 'user', select: 'fullName email department uid' },
      })
      .sort({ createdAt: -1 });

    const totalAttended = appointments.filter((a) => a.attendanceStatus === 'ATTENDED').length;
    const totalNoShow = appointments.filter((a) => a.attendanceStatus === 'NO_SHOW').length;
    const totalRecorded = totalAttended + totalNoShow;
    const attendanceRate = totalRecorded > 0 ? Math.round((totalAttended / totalRecorded) * 100) : 100;

    return {
      totalAttended,
      totalNoShow,
      totalRecorded,
      attendanceRate,
      records: appointments,
      attendanceSummary: {
        attendedCount: totalAttended,
        noShowCount: totalNoShow,
        attendanceRate,
      },
    };
  }

  /**
   * Teacher or Admin action: Update meeting details.
   */
  async updateMeetingDetails(
    userId: string,
    role: string,
    appointmentId: string,
    data: UpdateMeetingDetailsInput
  ): Promise<IAppointment> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId).populate('teacherProfile');
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const teacherProfile = appointment.teacherProfile as any;
    const isTeacherOwner = teacherProfile && teacherProfile.user.toString() === userId;
    const isAdmin = role === 'ADMIN';

    if (!isTeacherOwner && !isAdmin) {
      throw new AppError('Only the assigned faculty member can update meeting details.', 403);
    }

    appointment.meetingMode = data.meetingMode;
    if (data.meetingLink !== undefined) {
      appointment.meetingLink = data.meetingLink.trim() || undefined;
    }
    if (data.meetingInstructions !== undefined) {
      appointment.meetingInstructions = data.meetingInstructions.trim() || undefined;
    }

    await appointment.save();

    try {
      const modeText = data.meetingMode === 'ONLINE' ? 'Online Video Meet' : 'In-Person Cabin Consultation';
      await notificationService.createNotification({
        recipient: appointment.student.toString(),
        type: 'MEETING_LINK_ADDED',
        title: 'Consultation Details Updated',
        message: `Faculty updated consultation mode to ${modeText}.${data.meetingLink ? ' Meeting link is now available.' : ''}`,
        relatedAppointment: appointment._id,
      });
    } catch {}

    return appointment;
  }
}

export const appointmentService = new AppointmentService();
