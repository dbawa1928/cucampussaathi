import { Types } from 'mongoose';
import { RescheduleProposal, IRescheduleProposal } from '../models/RescheduleProposal';
import { Appointment, IAppointment } from '../models/Appointment';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { notificationService } from './notificationService';
import { AppError } from '../utils/errors';

export class RescheduleService {
  /**
   * Propose a new consultation slot for an active appointment.
   */
  async proposeReschedule(
    userId: string,
    role: string,
    appointmentId: string,
    proposedSlotId: string,
    reason?: string
  ): Promise<IRescheduleProposal> {
    if (!Types.ObjectId.isValid(appointmentId) || !Types.ObjectId.isValid(proposedSlotId)) {
      throw new AppError('Invalid appointment or slot identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('slot')
      .populate({
        path: 'teacherProfile',
        populate: { path: 'user', select: 'fullName email' },
      })
      .populate('student', 'fullName email');

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    // 1. Authorization: Caller must be student participant or assigned teacher
    const isStudentOwner = appointment.student._id.toString() === userId;
    const teacherUser = (appointment.teacherProfile as any)?.user;
    const isTeacherOwner = teacherUser && teacherUser._id.toString() === userId;
    const isAdmin = role === 'ADMIN';

    if (!isStudentOwner && !isTeacherOwner && !isAdmin) {
      throw new AppError('You are not authorized to propose rescheduling for this appointment.', 403);
    }

    // 2. State verification: Only PENDING or ACCEPTED appointments can be rescheduled
    if (appointment.status !== 'PENDING' && appointment.status !== 'ACCEPTED') {
      throw new AppError(
        `Cannot reschedule an appointment with status '${appointment.status}'. Only active appointments can be rescheduled.`,
        400
      );
    }

    const currentSlot = appointment.slot as any;
    if (currentSlot && new Date(currentSlot.startTime).getTime() <= Date.now()) {
      throw new AppError('Cannot reschedule an appointment that has already started or passed.', 400);
    }

    // 3. Prevent multiple pending proposals for the same appointment
    const existingPendingProposal = await RescheduleProposal.findOne({
      appointment: appointment._id,
      status: 'PENDING',
    });

    if (existingPendingProposal) {
      throw new AppError(
        'A pending reschedule proposal is already awaiting response for this consultation.',
        409
      );
    }

    // 4. Validate proposed slot
    const proposedSlot = await AvailabilitySlot.findById(proposedSlotId);
    if (!proposedSlot) {
      throw new AppError('Proposed availability slot not found.', 404);
    }

    if (!proposedSlot.teacherProfile.equals(appointment.teacherProfile._id)) {
      throw new AppError('The proposed slot does not belong to the assigned faculty member.', 400);
    }

    if (new Date(proposedSlot.startTime).getTime() <= Date.now()) {
      throw new AppError('Cannot reschedule to a slot in the past.', 400);
    }

    if (proposedSlot.status !== 'AVAILABLE' || proposedSlot.isBooked) {
      throw new AppError('The proposed slot is no longer available.', 409);
    }

    if (currentSlot && proposedSlot._id.equals(currentSlot._id)) {
      throw new AppError('The proposed slot is identical to the current consultation slot.', 400);
    }

    // 5. Create proposal
    const proposal = await RescheduleProposal.create({
      appointment: appointment._id,
      proposedBy: new Types.ObjectId(userId),
      proposedSlot: proposedSlot._id,
      originalSlot: appointment.slot._id,
      reason,
      status: 'PENDING',
    });

    // 6. Notify the other participant
    const recipientId = isStudentOwner ? teacherUser._id.toString() : appointment.student._id.toString();
    const proposerName = isStudentOwner
      ? (appointment.student as any).fullName
      : teacherUser.fullName;

    const formattedTime = new Date(proposedSlot.startTime).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await notificationService.createNotification({
      recipient: recipientId,
      type: 'APPOINTMENT_RESCHEDULE_REQUESTED',
      title: 'Reschedule Request Received',
      message: `${proposerName} requested to reschedule your consultation to ${formattedTime}.`,
      relatedAppointment: appointment._id,
      metadata: {
        proposalId: proposal._id.toString(),
        proposedSlotId: proposedSlot._id.toString(),
      },
    });

    return proposal;
  }

  /**
   * Retrieve all reschedule proposals for an appointment.
   */
  async getProposalsForAppointment(
    userId: string,
    role: string,
    appointmentId: string
  ): Promise<IRescheduleProposal[]> {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment identifier format.', 400);
    }

    const appointment = await Appointment.findById(appointmentId).populate('teacherProfile');
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const isStudentOwner = appointment.student.toString() === userId;
    const teacherUser = (appointment.teacherProfile as any)?.user;
    const isTeacherOwner = teacherUser && teacherUser.toString() === userId;
    const isAdmin = role === 'ADMIN';

    if (!isStudentOwner && !isTeacherOwner && !isAdmin) {
      throw new AppError('You are not authorized to view proposals for this appointment.', 403);
    }

    const proposals = await RescheduleProposal.find({ appointment: appointmentId })
      .sort({ createdAt: -1 })
      .populate('proposedSlot')
      .populate('originalSlot')
      .populate('proposedBy', 'fullName email role');

    return proposals;
  }

  /**
   * Accept a pending reschedule proposal (other participant only).
   */
  async acceptProposal(
    userId: string,
    role: string,
    proposalId: string
  ): Promise<{ appointment: IAppointment; proposal: IRescheduleProposal }> {
    if (!Types.ObjectId.isValid(proposalId)) {
      throw new AppError('Invalid proposal identifier format.', 400);
    }

    const proposal = await RescheduleProposal.findById(proposalId)
      .populate({
        path: 'appointment',
        populate: [
          { path: 'teacherProfile', populate: { path: 'user', select: 'fullName email' } },
          { path: 'student', select: 'fullName email' },
        ],
      })
      .populate('proposedSlot')
      .populate('originalSlot');

    if (!proposal) {
      throw new AppError('Reschedule proposal not found.', 404);
    }

    if (proposal.status !== 'PENDING') {
      throw new AppError(
        `This proposal has already been ${proposal.status.toLowerCase()}.`,
        400
      );
    }

    const appointment = proposal.appointment as any;
    if (!appointment) {
      throw new AppError('Associated appointment not found.', 404);
    }

    const isStudent = appointment.student._id.toString() === userId;
    const teacherUser = appointment.teacherProfile?.user;
    const isTeacher = teacherUser && teacherUser._id.toString() === userId;
    const isAdmin = role === 'ADMIN';

    // Must be a participant
    if (!isStudent && !isTeacher && !isAdmin) {
      throw new AppError('You are not authorized to respond to this proposal.', 403);
    }

    // Must NOT be the person who proposed it (the OTHER party must accept)
    if (proposal.proposedBy.toString() === userId && !isAdmin) {
      throw new AppError('You cannot accept your own reschedule proposal.', 400);
    }

    // 1. Atomically claim proposed slot
    const claimedSlot = await AvailabilitySlot.findOneAndUpdate(
      {
        _id: proposal.proposedSlot._id,
        isBooked: false,
        status: 'AVAILABLE',
        startTime: { $gt: new Date() },
      },
      {
        $set: { isBooked: true, status: 'RESERVED' },
      },
      { new: true }
    );

    if (!claimedSlot) {
      throw new AppError(
        'The proposed slot is no longer available or was reserved in the meantime.',
        409
      );
    }

    const oldSlotId = appointment.slot;

    // 2. Update appointment to new slot
    appointment.slot = proposal.proposedSlot._id;
    appointment.status = 'ACCEPTED';
    appointment.reminderSentAt = undefined; // reset reminder for new date/time
    await appointment.save();

    // 3. Mark proposal accepted
    proposal.status = 'ACCEPTED';
    proposal.respondedAt = new Date();
    await proposal.save();

    // 4. Safely release old slot back to AVAILABLE
    await AvailabilitySlot.updateOne(
      { _id: oldSlotId },
      { $set: { isBooked: false, status: 'AVAILABLE' } }
    );

    // 5. Notify the proposer that their request was accepted
    const responderName = isStudent
      ? (appointment.student as any).fullName
      : teacherUser.fullName;

    const formattedTime = new Date(claimedSlot.startTime).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await notificationService.createNotification({
      recipient: proposal.proposedBy.toString(),
      type: 'APPOINTMENT_RESCHEDULE_ACCEPTED',
      title: 'Reschedule Request Accepted',
      message: `${responderName} accepted your reschedule proposal. Consultation moved to ${formattedTime}.`,
      relatedAppointment: appointment._id,
      metadata: { proposalId: proposal._id.toString() },
    });

    return { appointment, proposal };
  }

  /**
   * Reject a pending reschedule proposal (other participant only).
   */
  async rejectProposal(
    userId: string,
    role: string,
    proposalId: string,
    reason?: string
  ): Promise<IRescheduleProposal> {
    if (!Types.ObjectId.isValid(proposalId)) {
      throw new AppError('Invalid proposal identifier format.', 400);
    }

    const proposal = await RescheduleProposal.findById(proposalId).populate({
      path: 'appointment',
      populate: [
        { path: 'teacherProfile', populate: { path: 'user', select: 'fullName email' } },
        { path: 'student', select: 'fullName email' },
      ],
    });

    if (!proposal) {
      throw new AppError('Reschedule proposal not found.', 404);
    }

    if (proposal.status !== 'PENDING') {
      throw new AppError(`Cannot reject a proposal that is already ${proposal.status}.`, 400);
    }

    const appointment = proposal.appointment as any;
    const isStudent = appointment.student._id.toString() === userId;
    const teacherUser = appointment.teacherProfile?.user;
    const isTeacher = teacherUser && teacherUser._id.toString() === userId;
    const isAdmin = role === 'ADMIN';

    if (!isStudent && !isTeacher && !isAdmin) {
      throw new AppError('You are not authorized to respond to this proposal.', 403);
    }

    if (proposal.proposedBy.toString() === userId && !isAdmin) {
      throw new AppError('You cannot reject your own proposal. Use withdraw instead.', 400);
    }

    proposal.status = 'REJECTED';
    proposal.respondedAt = new Date();
    if (reason) proposal.reason = reason;
    await proposal.save();

    // Notify proposer that request was declined
    const responderName = isStudent
      ? (appointment.student as any).fullName
      : teacherUser.fullName;

    await notificationService.createNotification({
      recipient: proposal.proposedBy.toString(),
      type: 'APPOINTMENT_RESCHEDULE_REJECTED',
      title: 'Reschedule Request Declined',
      message: `${responderName} declined the reschedule request. Your original appointment remains active.`,
      relatedAppointment: appointment._id,
      metadata: { proposalId: proposal._id.toString() },
    });

    return proposal;
  }

  /**
   * Withdraw a proposal by the original proposer.
   */
  async withdrawProposal(userId: string, proposalId: string): Promise<IRescheduleProposal> {
    if (!Types.ObjectId.isValid(proposalId)) {
      throw new AppError('Invalid proposal identifier format.', 400);
    }

    const proposal = await RescheduleProposal.findById(proposalId);
    if (!proposal) {
      throw new AppError('Reschedule proposal not found.', 404);
    }

    if (proposal.status !== 'PENDING') {
      throw new AppError(`Cannot withdraw a proposal that is already ${proposal.status}.`, 400);
    }

    if (proposal.proposedBy.toString() !== userId) {
      throw new AppError('Only the member who proposed the reschedule can withdraw it.', 403);
    }

    proposal.status = 'WITHDRAWN';
    proposal.respondedAt = new Date();
    await proposal.save();

    return proposal;
  }
}

export const rescheduleService = new RescheduleService();
