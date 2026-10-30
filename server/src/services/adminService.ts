import { Types } from 'mongoose';
import { User, AccountStatus } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { TeacherProfile } from '../models/TeacherProfile';
import { Appointment } from '../models/Appointment';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { RescheduleProposal } from '../models/RescheduleProposal';
import { auditService } from './auditService';
import { notificationService } from './notificationService';
import { generateCsv } from '../utils/csvExport';
import { AppError } from '../utils/errors';

export class AdminService {
  /**
   * 1. ADMIN OVERVIEW DASHBOARD
   * Aggregates live platform numbers from MongoDB Atlas without fake data.
   */
  async getDashboardOverview() {
    const [
      totalStudents,
      totalTeachers,
      activeUsers,
      suspendedUsers,
      pendingVerifications,
      verifiedTeachers,
      totalAppointments,
      pendingAppointments,
      acceptedAppointments,
      completedAppointments,
      cancelledAppointments,
      departmentStats,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: 'TEACHER' }),
      User.countDocuments({ accountStatus: 'ACTIVE' }),
      User.countDocuments({ accountStatus: 'SUSPENDED' }),
      TeacherProfile.countDocuments({ verificationStatus: 'PENDING' }),
      TeacherProfile.countDocuments({ verificationStatus: 'VERIFIED' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'PENDING' }),
      Appointment.countDocuments({ status: 'ACCEPTED' }),
      Appointment.countDocuments({ status: 'COMPLETED' }),
      Appointment.countDocuments({ status: 'CANCELLED' }),
      User.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      auditService.getAuditLogs({ limit: 10 }),
    ]);

    return {
      users: {
        totalStudents,
        totalTeachers,
        totalUsers: totalStudents + totalTeachers,
        activeUsers,
        suspendedUsers,
      },
      verification: {
        pendingVerifications,
        verifiedTeachers,
        rejectedTeachers: totalTeachers - verifiedTeachers - pendingVerifications,
      },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        accepted: acceptedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        completionRate:
          totalAppointments > 0
            ? Number(((completedAppointments / totalAppointments) * 100).toFixed(1))
            : 0,
        cancellationRate:
          totalAppointments > 0
            ? Number(((cancelledAppointments / totalAppointments) * 100).toFixed(1))
            : 0,
      },
      departments: departmentStats.map((d) => ({
        department: d._id || 'Unassigned',
        userCount: d.count,
      })),
      recentActivity: recentAuditLogs.logs,
    };
  }

  /**
   * 2. PLATFORM ANALYTICS
   * Aggregates trend metrics across 7d, 30d, 90d, or all time.
   */
  async getPlatformAnalytics(timeframe: '7d' | '30d' | '90d' | 'all' = '30d') {
    let cutoffDate: Date | null = null;
    const now = new Date();

    if (timeframe === '7d') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === '30d') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeframe === '90d') {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const dateFilter = cutoffDate ? { createdAt: { $gte: cutoffDate } } : {};

    // 1. User registrations over time
    const registrationTrends = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Format registration trends into clean timeline array
    const dateMap: Record<string, { date: string; student: number; teacher: number }> = {};
    for (const item of registrationTrends) {
      const d = item._id.date;
      if (!dateMap[d]) {
        dateMap[d] = { date: d, student: 0, teacher: 0 };
      }
      if (item._id.role === 'STUDENT') {
        dateMap[d].student += item.count;
      } else if (item._id.role === 'TEACHER') {
        dateMap[d].teacher += item.count;
      }
    }
    const userTimeline = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    // 2. Appointment trends over time
    const appointmentTrends = await Appointment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const apptMap: Record<string, any> = {};
    for (const item of appointmentTrends) {
      const d = item._id.date;
      if (!apptMap[d]) {
        apptMap[d] = { date: d, total: 0, completed: 0, cancelled: 0, accepted: 0, pending: 0 };
      }
      apptMap[d].total += item.count;
      const s = item._id.status.toLowerCase();
      if (apptMap[d][s] !== undefined) {
        apptMap[d][s] += item.count;
      }
    }
    const appointmentTimeline = Object.values(apptMap).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Department distribution
    const departmentDistribution = await User.aggregate([
      { $group: { _id: { department: '$department', role: '$role' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 4. Overall appointment counts in this timeframe
    const [totalInPeriod, completedInPeriod, cancelledInPeriod, acceptedInPeriod] =
      await Promise.all([
        Appointment.countDocuments(dateFilter),
        Appointment.countDocuments({ ...dateFilter, status: 'COMPLETED' }),
        Appointment.countDocuments({ ...dateFilter, status: 'CANCELLED' }),
        Appointment.countDocuments({ ...dateFilter, status: 'ACCEPTED' }),
      ]);

    return {
      timeframe,
      summary: {
        totalAppointments: totalInPeriod,
        completedAppointments: completedInPeriod,
        cancelledAppointments: cancelledInPeriod,
        acceptedAppointments: acceptedInPeriod,
        completionRate:
          totalInPeriod > 0
            ? Number(((completedInPeriod / totalInPeriod) * 100).toFixed(1))
            : 0,
        cancellationRate:
          totalInPeriod > 0
            ? Number(((cancelledInPeriod / totalInPeriod) * 100).toFixed(1))
            : 0,
      },
      userTimeline,
      appointmentTimeline,
      departmentDistribution,
    };
  }

  /**
   * 3. STUDENT MANAGEMENT - LIST
   */
  async listStudents(query: {
    search?: string;
    department?: string;
    course?: string;
    semester?: number;
    accountStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const userMatch: Record<string, any> = { role: 'STUDENT' };

    if (query.accountStatus) {
      userMatch.accountStatus = query.accountStatus;
    }
    if (query.department) {
      userMatch.department = query.department;
    }
    if (query.search) {
      const q = query.search.trim();
      userMatch.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { uid: { $regex: q, $options: 'i' } },
      ];
    }

    const [students, total] = await Promise.all([
      User.find(userMatch)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(userMatch),
    ]);

    // Attach student profile for each user
    const studentUserIds = students.map((s) => s._id);
    const profiles = await StudentProfile.find({ user: { $in: studentUserIds } }).lean();
    const profileMap = new Map(profiles.map((p) => [p.user.toString(), p]));

    const enrichedStudents = students.map((s) => ({
      ...s,
      profile: profileMap.get(s._id.toString()) || null,
    }));

    return {
      students: enrichedStudents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 3. STUDENT MANAGEMENT - GET DETAILS
   */
  async getStudentDetails(studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student user ID.', 400);
    }

    const student = await User.findOne({ _id: studentId, role: 'STUDENT' })
      .select('-passwordHash')
      .lean();
    if (!student) {
      throw new AppError('Student account not found.', 404);
    }

    const [profile, appointmentStats] = await Promise.all([
      StudentProfile.findOne({ user: studentId }).lean(),
      Appointment.aggregate([
        { $match: { student: new Types.ObjectId(studentId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statsMap: Record<string, number> = {};
    for (const s of appointmentStats) {
      statsMap[s._id] = s.count;
    }

    return {
      student,
      profile,
      appointmentStats: {
        total: Object.values(statsMap).reduce((a, b) => a + b, 0),
        pending: statsMap.PENDING || 0,
        accepted: statsMap.ACCEPTED || 0,
        completed: statsMap.COMPLETED || 0,
        cancelled: statsMap.CANCELLED || 0,
      },
    };
  }

  /**
   * 3. STUDENT MANAGEMENT - UPDATE STATUS
   */
  async updateStudentStatus(
    studentId: string,
    status: AccountStatus,
    reason: string | undefined,
    adminId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID.', 400);
    }

    const student = await User.findOne({ _id: studentId, role: 'STUDENT' });
    if (!student) {
      throw new AppError('Student account not found.', 404);
    }

    const previousStatus = student.accountStatus;
    student.accountStatus = status;

    if (status === 'SUSPENDED') {
      student.suspensionReason = reason?.trim() || 'Administrative suspension';
      student.suspendedAt = new Date();
      student.suspendedBy = new Types.ObjectId(adminId);
    } else {
      student.suspensionReason = undefined;
      student.suspendedAt = undefined;
      student.suspendedBy = undefined;
    }

    await student.save();

    // Notify student
    const isSuspended = status === 'SUSPENDED';
    await notificationService.createNotification({
      recipient: student._id.toString(),
      type: isSuspended ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_REACTIVATED',
      title: isSuspended ? 'Account Suspended by Administration' : 'Account Reactivated',
      message: isSuspended
        ? `Your student account has been suspended: ${student.suspensionReason || 'Please contact campus administrator.'}`
        : 'Your university student account has been reactivated. You may now access all campus services.',
    });

    // Record in Audit Log
    await auditService.logAdminAction({
      adminId,
      action: isSuspended ? 'STUDENT_SUSPENDED' : 'STUDENT_REACTIVATED',
      targetUserId: student._id,
      entityType: 'USER',
      reason,
      metadata: { previousStatus, newStatus: status },
      ipAddress,
    });

    return student;
  }

  /**
   * 4. TEACHER MANAGEMENT - LIST
   */
  async listTeachers(query: {
    search?: string;
    department?: string;
    verificationStatus?: string;
    accountStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const userMatch: Record<string, any> = { role: 'TEACHER' };

    if (query.accountStatus) {
      userMatch.accountStatus = query.accountStatus;
    }
    if (query.department) {
      userMatch.department = query.department;
    }
    if (query.search) {
      const q = query.search.trim();
      userMatch.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { uid: { $regex: q, $options: 'i' } },
      ];
    }

    const [teachers, total] = await Promise.all([
      User.find(userMatch)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(userMatch),
    ]);

    const teacherUserIds = teachers.map((t) => t._id);
    const profileFilter: Record<string, any> = { user: { $in: teacherUserIds } };
    if (query.verificationStatus) {
      profileFilter.verificationStatus = query.verificationStatus;
    }

    const profiles = await TeacherProfile.find(profileFilter).lean();
    const profileMap = new Map(profiles.map((p) => [p.user.toString(), p]));

    let filteredTeachers = teachers.map((t) => ({
      ...t,
      profile: profileMap.get(t._id.toString()) || null,
    }));

    if (query.verificationStatus) {
      filteredTeachers = filteredTeachers.filter((t) => t.profile !== null);
    }

    return {
      teachers: filteredTeachers,
      pagination: {
        page,
        limit,
        total: query.verificationStatus ? filteredTeachers.length : total,
        totalPages: Math.ceil((query.verificationStatus ? filteredTeachers.length : total) / limit) || 1,
      },
    };
  }

  /**
   * 4. TEACHER MANAGEMENT - GET DETAILS
   */
  async getTeacherDetails(teacherId: string) {
    if (!Types.ObjectId.isValid(teacherId)) {
      throw new AppError('Invalid teacher user ID.', 400);
    }

    const teacher = await User.findOne({ _id: teacherId, role: 'TEACHER' })
      .select('-passwordHash')
      .lean();
    if (!teacher) {
      throw new AppError('Faculty account not found.', 404);
    }

    const profile = await TeacherProfile.findOne({ user: teacherId }).lean();

    let slotCount = 0;
    let appointmentStats: Record<string, number> = {};

    if (profile) {
      const [slots, appointments] = await Promise.all([
        AvailabilitySlot.countDocuments({ teacherProfile: profile._id }),
        Appointment.aggregate([
          { $match: { teacherProfile: profile._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);
      slotCount = slots;
      for (const a of appointments) {
        appointmentStats[a._id] = a.count;
      }
    }

    return {
      teacher,
      profile,
      slotCount,
      appointmentStats: {
        total: Object.values(appointmentStats).reduce((a, b) => a + b, 0),
        pending: appointmentStats.PENDING || 0,
        accepted: appointmentStats.ACCEPTED || 0,
        completed: appointmentStats.COMPLETED || 0,
        cancelled: appointmentStats.CANCELLED || 0,
      },
    };
  }

  /**
   * 4. TEACHER MANAGEMENT - UPDATE STATUS
   */
  async updateTeacherStatus(
    teacherId: string,
    status: AccountStatus,
    reason: string | undefined,
    adminId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(teacherId)) {
      throw new AppError('Invalid faculty ID.', 400);
    }

    const teacher = await User.findOne({ _id: teacherId, role: 'TEACHER' });
    if (!teacher) {
      throw new AppError('Faculty account not found.', 404);
    }

    const previousStatus = teacher.accountStatus;
    teacher.accountStatus = status;

    if (status === 'SUSPENDED') {
      teacher.suspensionReason = reason?.trim() || 'Administrative suspension';
      teacher.suspendedAt = new Date();
      teacher.suspendedBy = new Types.ObjectId(adminId);
    } else {
      teacher.suspensionReason = undefined;
      teacher.suspendedAt = undefined;
      teacher.suspendedBy = undefined;
    }

    await teacher.save();

    // Notify teacher
    const isSuspended = status === 'SUSPENDED';
    await notificationService.createNotification({
      recipient: teacher._id.toString(),
      type: isSuspended ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_REACTIVATED',
      title: isSuspended ? 'Faculty Account Suspended' : 'Faculty Account Reactivated',
      message: isSuspended
        ? `Your faculty account has been suspended: ${teacher.suspensionReason || 'Please contact campus administrator.'}`
        : 'Your faculty account has been restored to active status.',
    });

    // Record in Audit Log
    await auditService.logAdminAction({
      adminId,
      action: isSuspended ? 'TEACHER_SUSPENDED' : 'TEACHER_REACTIVATED',
      targetUserId: teacher._id,
      entityType: 'USER',
      reason,
      metadata: { previousStatus, newStatus: status },
      ipAddress,
    });

    return teacher;
  }

  /**
   * 5. FACULTY VERIFICATION WORKFLOW - LIST
   */
  async listVerifications(query: {
    status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    department?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status) {
      filter.verificationStatus = query.status;
    }
    if (query.department) {
      filter.department = query.department;
    }

    const [verifications, total] = await Promise.all([
      TeacherProfile.find(filter)
        .populate('user', 'fullName email uid department accountStatus createdAt')
        .populate('verifiedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TeacherProfile.countDocuments(filter),
    ]);

    return {
      verifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 5. FACULTY VERIFICATION WORKFLOW - APPROVE OR REJECT
   */
  async verifyFaculty(
    profileId: string,
    decision: 'APPROVE' | 'REJECT',
    reason: string | undefined,
    adminId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(profileId)) {
      throw new AppError('Invalid faculty profile ID.', 400);
    }

    const profile = await TeacherProfile.findById(profileId);
    if (!profile) {
      throw new AppError('Faculty profile not found.', 404);
    }

    const teacherUser = await User.findById(profile.user);
    if (!teacherUser) {
      throw new AppError('Associated faculty user account not found.', 404);
    }

    const previousStatus = profile.verificationStatus;
    const isApproved = decision === 'APPROVE';

    profile.verificationStatus = isApproved ? 'VERIFIED' : 'REJECTED';
    profile.verifiedAt = new Date();
    profile.verifiedBy = new Types.ObjectId(adminId);
    profile.rejectionReason = isApproved ? undefined : reason?.trim() || 'Application rejected by administration.';
    await profile.save();

    // Also update User.isVerified in sync
    teacherUser.isVerified = isApproved;
    await teacherUser.save();

    // Send persistent + real-time notification
    await notificationService.createNotification({
      recipient: teacherUser._id.toString(),
      type: isApproved ? 'FACULTY_VERIFIED' : 'FACULTY_REJECTED',
      title: isApproved ? 'Faculty Verification Approved' : 'Faculty Verification Declined',
      message: isApproved
        ? 'Congratulations! Your faculty profile has been officially verified by Chandigarh University administration. You may now publish consultation availability.'
        : `Your faculty verification application was not approved: ${profile.rejectionReason}. Please update your academic details and resubmit.`,
    });

    // Record in Audit Log
    await auditService.logAdminAction({
      adminId,
      action: isApproved ? 'FACULTY_APPROVED' : 'FACULTY_REJECTED',
      targetUserId: teacherUser._id,
      entityType: 'TEACHER_PROFILE',
      reason,
      metadata: { previousStatus, newStatus: profile.verificationStatus, profileId },
      ipAddress,
    });

    return profile;
  }

  /**
   * 6. APPOINTMENT MONITORING - LIST
   */
  async listAppointments(query: {
    search?: string;
    status?: string;
    meetingMode?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.meetingMode) {
      filter.meetingMode = query.meetingMode;
    }
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.createdAt.$lte = new Date(query.endDate);
      }
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('student', 'fullName email uid department')
        .populate({
          path: 'teacherProfile',
          populate: { path: 'user', select: 'fullName email department uid' },
        })
        .populate('slot')
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    return {
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 6. APPOINTMENT MONITORING - GET DETAILS
   */
  async getAppointmentDetails(appointmentId: string) {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment ID.', 400);
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('student', 'fullName email uid department')
      .populate({
        path: 'teacherProfile',
        populate: { path: 'user', select: 'fullName email department uid' },
      })
      .populate('slot')
      .lean();

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    // Load any rescheduling proposals for this appointment
    const proposals = await RescheduleProposal.find({ appointment: appointmentId })
      .populate('proposedBy', 'fullName role')
      .populate('proposedSlot')
      .populate('originalSlot')
      .sort({ createdAt: -1 })
      .lean();

    return {
      appointment,
      proposals,
    };
  }

  /**
   * 6. APPOINTMENT MONITORING - ADMINISTRATIVE CANCELLATION
   */
  async cancelAppointmentAdmin(
    appointmentId: string,
    reason: string,
    adminId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment ID.', 400);
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('student', 'fullName email')
      .populate({
        path: 'teacherProfile',
        populate: { path: 'user', select: 'fullName email' },
      });

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    if (appointment.status === 'COMPLETED') {
      throw new AppError('Cannot cancel an appointment that has already been completed.', 400);
    }
    if (appointment.status === 'CANCELLED') {
      throw new AppError('Appointment is already cancelled.', 400);
    }

    const previousStatus = appointment.status;
    appointment.status = 'CANCELLED';
    appointment.rejectionReason = `Cancelled by Campus Administration: ${reason.trim()}`;
    await appointment.save();

    // Safely restore slot back to AVAILABLE
    if (appointment.slot) {
      await AvailabilitySlot.findByIdAndUpdate(appointment.slot, {
        $set: { isBooked: false, status: 'AVAILABLE' },
      });
    }

    const studentUser: any = appointment.student;
    const teacherUser: any = (appointment.teacherProfile as any)?.user;

    // Notify student
    if (studentUser?._id) {
      await notificationService.createNotification({
        recipient: studentUser._id.toString(),
        type: 'APPOINTMENT_ADMIN_CANCELLED',
        title: 'Appointment Cancelled by Administration',
        message: `Your appointment has been cancelled by university administration. Reason: ${reason.trim()}`,
        relatedAppointment: appointment._id.toString(),
      });
    }

    // Notify teacher
    if (teacherUser?._id) {
      await notificationService.createNotification({
        recipient: teacherUser._id.toString(),
        type: 'APPOINTMENT_ADMIN_CANCELLED',
        title: 'Consultation Cancelled by Administration',
        message: `A consultation appointment has been administratively cancelled. Reason: ${reason.trim()}`,
        relatedAppointment: appointment._id.toString(),
      });
    }

    // Log to Audit Log
    await auditService.logAdminAction({
      adminId,
      action: 'APPOINTMENT_ADMIN_CANCELLED',
      targetAppointmentId: appointment._id,
      entityType: 'APPOINTMENT',
      reason,
      metadata: { previousStatus, studentId: studentUser?._id, teacherId: teacherUser?._id },
      ipAddress,
    });

    return appointment;
  }

  /**
   * 7. REPORTS AND CSV EXPORT
   */
  async exportReport(
    type: 'students' | 'teachers' | 'verifications' | 'appointments' | 'platform-summary',
    adminId: string,
    ipAddress?: string
  ): Promise<{ filename: string; csv: string }> {
    let filename = `cucampus-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    let csv = '';

    if (type === 'students') {
      const students = await User.find({ role: 'STUDENT' })
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .lean();
      const profiles = await StudentProfile.find().lean();
      const pMap = new Map(profiles.map((p) => [p.user.toString(), p]));

      const headers = [
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'uid', label: 'University UID' },
        { key: 'department', label: 'Department' },
        { key: 'course', label: 'Course' },
        { key: 'semester', label: 'Semester' },
        { key: 'accountStatus', label: 'Account Status' },
        { key: 'createdAt', label: 'Registered Date' },
      ];

      const rows = students.map((s) => {
        const p = pMap.get(s._id.toString());
        return {
          fullName: s.fullName,
          email: s.email,
          uid: s.uid,
          department: s.department,
          course: p?.course || 'N/A',
          semester: p?.semester || 'N/A',
          accountStatus: s.accountStatus,
          createdAt: s.createdAt?.toISOString() || '',
        };
      });

      csv = generateCsv(headers, rows);
    } else if (type === 'teachers') {
      const teachers = await User.find({ role: 'TEACHER' })
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .lean();
      const profiles = await TeacherProfile.find().lean();
      const pMap = new Map(profiles.map((p) => [p.user.toString(), p]));

      const headers = [
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'uid', label: 'Faculty UID' },
        { key: 'department', label: 'Department' },
        { key: 'designation', label: 'Designation' },
        { key: 'officeLocation', label: 'Office Location' },
        { key: 'verificationStatus', label: 'Verification Status' },
        { key: 'accountStatus', label: 'Account Status' },
        { key: 'createdAt', label: 'Registered Date' },
      ];

      const rows = teachers.map((t) => {
        const p = pMap.get(t._id.toString());
        return {
          fullName: t.fullName,
          email: t.email,
          uid: t.uid,
          department: t.department,
          designation: p?.designation || 'N/A',
          officeLocation: p?.officeLocation || 'N/A',
          verificationStatus: p?.verificationStatus || 'PENDING',
          accountStatus: t.accountStatus,
          createdAt: t.createdAt?.toISOString() || '',
        };
      });

      csv = generateCsv(headers, rows);
    } else if (type === 'verifications') {
      const profiles = await TeacherProfile.find()
        .populate('user', 'fullName email uid department')
        .populate('verifiedBy', 'fullName')
        .sort({ createdAt: -1 })
        .lean();

      const headers = [
        { key: 'fullName', label: 'Faculty Name' },
        { key: 'email', label: 'Email' },
        { key: 'uid', label: 'Faculty UID' },
        { key: 'department', label: 'Department' },
        { key: 'designation', label: 'Designation' },
        { key: 'officeLocation', label: 'Cabin Location' },
        { key: 'verificationStatus', label: 'Status' },
        { key: 'verifiedBy', label: 'Verified By' },
        { key: 'verifiedAt', label: 'Verification Date' },
        { key: 'rejectionReason', label: 'Rejection Reason' },
      ];

      const rows = profiles.map((p: any) => ({
        fullName: p.user?.fullName || 'N/A',
        email: p.user?.email || 'N/A',
        uid: p.user?.uid || 'N/A',
        department: p.department,
        designation: p.designation,
        officeLocation: p.officeLocation,
        verificationStatus: p.verificationStatus,
        verifiedBy: p.verifiedBy?.fullName || 'N/A',
        verifiedAt: p.verifiedAt ? new Date(p.verifiedAt).toISOString() : 'N/A',
        rejectionReason: p.rejectionReason || 'None',
      }));

      csv = generateCsv(headers, rows);
    } else if (type === 'appointments') {
      const appointments = await Appointment.find()
        .populate('student', 'fullName email uid')
        .populate({
          path: 'teacherProfile',
          populate: { path: 'user', select: 'fullName department' },
        })
        .populate('slot')
        .sort({ createdAt: -1 })
        .lean();

      const headers = [
        { key: 'id', label: 'Appointment ID' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'studentUid', label: 'Student UID' },
        { key: 'teacherName', label: 'Faculty Name' },
        { key: 'department', label: 'Department' },
        { key: 'status', label: 'Status' },
        { key: 'meetingMode', label: 'Mode' },
        { key: 'meetingLink', label: 'Meeting Link' },
        { key: 'agenda', label: 'Agenda' },
        { key: 'createdAt', label: 'Created At' },
      ];

      const rows = appointments.map((a: any) => ({
        id: a._id.toString(),
        studentName: a.student?.fullName || 'Unknown',
        studentUid: a.student?.uid || 'Unknown',
        teacherName: a.teacherProfile?.user?.fullName || 'Unknown',
        department: a.teacherProfile?.department || 'N/A',
        status: a.status,
        meetingMode: a.meetingMode,
        meetingLink: a.meetingLink || 'N/A',
        agenda: a.agenda,
        createdAt: a.createdAt?.toISOString() || '',
      }));

      csv = generateCsv(headers, rows);
    } else if (type === 'platform-summary') {
      const overview = await this.getDashboardOverview();
      const headers = [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' },
      ];

      const rows = [
        { metric: 'Total Students', value: overview.users.totalStudents },
        { metric: 'Total Teachers', value: overview.users.totalTeachers },
        { metric: 'Active Accounts', value: overview.users.activeUsers },
        { metric: 'Suspended Accounts', value: overview.users.suspendedUsers },
        { metric: 'Pending Faculty Verifications', value: overview.verification.pendingVerifications },
        { metric: 'Verified Faculty', value: overview.verification.verifiedTeachers },
        { metric: 'Total Appointments', value: overview.appointments.total },
        { metric: 'Pending Appointments', value: overview.appointments.pending },
        { metric: 'Accepted Appointments', value: overview.appointments.accepted },
        { metric: 'Completed Appointments', value: overview.appointments.completed },
        { metric: 'Cancelled Appointments', value: overview.appointments.cancelled },
        { metric: 'Completion Rate (%)', value: overview.appointments.completionRate },
        { metric: 'Cancellation Rate (%)', value: overview.appointments.cancellationRate },
      ];

      csv = generateCsv(headers, rows);
    } else {
      throw new AppError('Invalid report type requested.', 400);
    }

    // Log the export action in audit log
    await auditService.logAdminAction({
      adminId,
      action: 'REPORT_EXPORTED',
      entityType: 'REPORT',
      metadata: { reportType: type, filename },
      ipAddress,
    });

    return { filename, csv };
  }

  /**
   * Helper: Prevent self-lockout of the last active administrator
   */
  async preventSelfLockout(targetUserId: string, currentAdminId: string) {
    if (targetUserId === currentAdminId) {
      const activeAdminCount = await User.countDocuments({
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
      });
      if (activeAdminCount <= 1) {
        throw new AppError('Cannot suspend your own account: you are the only active administrator.', 400);
      }
    }
  }
}

export const adminService = new AdminService();
