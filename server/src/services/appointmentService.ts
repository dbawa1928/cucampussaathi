import { Types } from 'mongoose';
import { Appointment, IAppointment, AppointmentStatus } from '../models/Appointment';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { TeacherProfile } from '../models/TeacherProfile';
import { User } from '../models/User';
import { BookAppointmentInput, UpdateMeetingDetailsInput } from '../utils/validators';
import { notificationService } from './notificationService';
import { AppError } from '../utils/errors';

export class AppointmentService {
  /**
   * Book an available future slot with concurrency safeguards.
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

    // 2. Prevent self-booking if the student is somehow linked to the teacher profile
    if (teacherProfile.user && teacherProfile.user.toString() === studentUserId) {
      throw new AppError('You cannot book a consultation appointment with yourself.', 400);
    }

    // 3. Check faculty availability preference
    if (teacherProfile.isAcceptingBookings === false) {
      throw new AppError(
        'This faculty member is currently not accepting new consultation appointments.',
        400
      );
    }

    // 4. Enforce teacher daily booking capacity
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

    // 5. ATOMIC SLOT RESERVATION: Concurrency safeguard
    // Only updates if the slot is STILL unbooked and in the future
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

    // 6. Create appointment document
    try {
      const appointment = await Appointment.create({
        student: student._id,
        teacherProfile: teacherProfile._id,
        slot: slot._id,
        agenda: data.agenda,
        status: 'PENDING',
      });

      // Send in-app & real-time notification to the assigned teacher
      try {
        const slotTime = new Date(slot.startTime).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        const teacherUserId = teacherProfile.user?._id || teacherProfile.user;
        await notificationService.createNotification({
          recipient: teacherUserId.toString(),
          type: 'APPOINTMENT_BOOKED',
          title: 'New Consultation Request',
          message: `${student.fullName} has requested a consultation for ${slotTime}.`,
          relatedAppointment: appointment._id,
        });
      } catch {
        // Notification delivery failure does not fail the booking
      }

      return appointment;
    } catch (err: any) {
      // Rollback the slot reservation if appointment creation failed (e.g. partial unique index trigger)
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
   * List appointments for the authenticated caller (Student or Teacher) with pagination and filtering.
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

    // Authorization: Must be student who booked, teacher assigned, or admin
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

    const appointment = await Appointment.findById(appointmentId).populate('teacherProfile');
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const teacherProfile = appointment.teacherProfile as any;
    if (!teacherProfile || teacherProfile.user.toString() !== teacherUserId) {
      throw new AppError('Only the assigned faculty member can accept this appointment.', 403);
    }

    // State machine: Only PENDING -> ACCEPTED
    if (appointment.status !== 'PENDING') {
      throw new AppError(
        `Cannot accept an appointment with status '${appointment.status}'. Only PENDING appointments can be accepted.`,
        400
      );
    }

    appointment.status = 'ACCEPTED';
    await appointment.save();

    // Send in-app & real-time notification to the student
    try {
      await notificationService.createNotification({
        recipient: appointment.student.toString(),
        type: 'APPOINTMENT_ACCEPTED',
        title: 'Consultation Request Confirmed',
        message: 'Your faculty consultation request has been accepted.',
        relatedAppointment: appointment._id,
      });
    } catch {}

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

    const appointment = await Appointment.findById(appointmentId).populate('teacherProfile');
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const teacherProfile = appointment.teacherProfile as any;
    if (!teacherProfile || teacherProfile.user.toString() !== teacherUserId) {
      throw new AppError('Only the assigned faculty member can reject this appointment.', 403);
    }

    // State machine: Only PENDING -> REJECTED
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

    // Release the slot back to AVAILABLE
    await AvailabilitySlot.updateOne(
      { _id: appointment.slot },
      { $set: { isBooked: false, status: 'AVAILABLE' } }
    );

    // Send in-app & real-time notification to the student
    try {
      const reasonMsg = rejectionReason ? ` Reason: ${rejectionReason}` : '';
      await notificationService.createNotification({
        recipient: appointment.student.toString(),
        type: 'APPOINTMENT_REJECTED',
        title: 'Consultation Request Declined',
        message: `Your consultation request was declined by faculty.${reasonMsg}`,
        relatedAppointment: appointment._id,
      });
    } catch {}

    return appointment;
  }

  /**
   * Cancel an appointment (accessible by the booking student or assigned teacher).
   * Releases the availability slot for future bookings.
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

    const appointment = await Appointment.findById(appointmentId).populate('teacherProfile');
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const isStudentOwner = appointment.student.toString() === userId;
    const teacherProfile = appointment.teacherProfile as any;
    const isTeacherOwner = teacherProfile && teacherProfile.user.toString() === userId;
    const isAdmin = role === 'ADMIN';

    if (!isStudentOwner && !isTeacherOwner && !isAdmin) {
      throw new AppError('You are not authorized to cancel this appointment.', 403);
    }

    // State machine: Can only cancel if PENDING or ACCEPTED
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

    // Atomically release the slot so other students can book it
    await AvailabilitySlot.updateOne(
      { _id: appointment.slot },
      { $set: { isBooked: false, status: 'AVAILABLE' } }
    );

    // Send in-app & real-time notification to the other participant
    try {
      const recipientId = isStudentOwner ? teacherProfile.user.toString() : appointment.student.toString();
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

    return appointment;
  }

  /**
   * Teacher action: Mark an accepted consultation as completed with notes.
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

    // State machine: Only ACCEPTED -> COMPLETED
    if (appointment.status !== 'ACCEPTED') {
      throw new AppError(
        `Only ACCEPTED appointments can be marked as COMPLETED. Current status: ${appointment.status}.`,
        400
      );
    }

    appointment.status = 'COMPLETED';
    if (teacherNotes) {
      appointment.teacherNotes = teacherNotes;
    }
    await appointment.save();

    // Send in-app & real-time notification to the student
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
   * Teacher or Admin action: Update meeting mode, meeting link, and meeting instructions.
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

    // Send in-app & real-time notification to student
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
