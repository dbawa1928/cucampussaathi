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
import { CampusEvent } from '../models/CampusEvent';
import { TeachingListingModel } from '../models/TeachingListing';
import { LearningGoalModel } from '../models/LearningGoal';
import { SkillConnectionModel } from '../models/SkillConnection';
import { LearningGroupModel } from '../models/LearningGroup';
import { LearnTeachReportModel } from '../models/LearnTeachReport';
import { DocumentModel } from '../models/Document';
import { ContactMessage } from '../models/ContactMessage';
import { PlatformSetting } from '../models/PlatformSetting';
import { TeacherStudentRestriction } from '../models/TeacherStudentRestriction';
import { AdminAuditLog } from '../models/AdminAuditLog';


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
      publishedEvents,
      totalEvents,
      activeTeachingListings,
      activeLearningGoals,
      activeConnections,
      activeGroups,
      pendingLearnTeachReports,
      totalStudyDocuments,
      pendingContactMessages,
      activeRestrictions,
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
      CampusEvent.countDocuments({ status: 'PUBLISHED' }),
      CampusEvent.countDocuments(),
      TeachingListingModel.countDocuments({ status: 'ACTIVE' }),
      LearningGoalModel.countDocuments({ status: 'ACTIVE' }),
      SkillConnectionModel.countDocuments({ status: 'ACCEPTED' }),
      LearningGroupModel.countDocuments({ status: 'ACTIVE' }),
      LearnTeachReportModel.countDocuments({ status: 'PENDING' }),
      DocumentModel.countDocuments(),
      ContactMessage.countDocuments({ status: 'NEW' }),
      TeacherStudentRestriction.countDocuments({ isActive: true }),
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
      departments: departmentStats.map((d: any) => ({
        department: d._id || 'Unassigned',
        userCount: d.count,
      })),
      recentActivity: recentAuditLogs.logs,
      events: {
        published: publishedEvents,
        total: totalEvents,
      },
      learnTeach: {
        activeListings: activeTeachingListings,
        activeGoals: activeLearningGoals,
        connections: activeConnections,
        activeGroups: activeGroups,
        pendingReports: pendingLearnTeachReports,
      },
      aiTutor: {
        totalDocuments: totalStudyDocuments,
      },
      communication: {
        pendingContactMessages,
      },
      restrictions: {
        active: activeRestrictions,
      },
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

  /**
   * 9. UNIVERSAL USER MANAGEMENT
   * Paginated, filtered search across all platform accounts (STUDENTS, TEACHERS, ADMINS).
   */
  async listAllUsers(query: {
    search?: string;
    role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
    department?: string;
    accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.role) {
      filter.role = query.role;
    }
    if (query.department && query.department !== 'ALL') {
      filter.department = query.department;
    }
    if (query.accountStatus && (query.accountStatus as string) !== 'ALL') {
      filter.accountStatus = query.accountStatus;
    }
    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { uid: { $regex: q, $options: 'i' } },
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .select('-passwordHash')
        .lean(),
      User.countDocuments(filter),
    ]);

    const studentUserIds = users.filter((u) => u.role === 'STUDENT').map((u) => u._id);
    const teacherUserIds = users.filter((u) => u.role === 'TEACHER').map((u) => u._id);

    const [studentProfiles, teacherProfiles] = await Promise.all([
      StudentProfile.find({ user: { $in: studentUserIds } }).lean(),
      TeacherProfile.find({ user: { $in: teacherUserIds } }).lean(),
    ]);

    const sMap = new Map(studentProfiles.map((p) => [p.user.toString(), p]));
    const tMap = new Map(teacherProfiles.map((p) => [p.user.toString(), p]));

    const enrichedUsers = users.map((u) => {
      const uidStr = u._id.toString();
      return {
        ...u,
        profile: u.role === 'STUDENT' ? sMap.get(uidStr) : u.role === 'TEACHER' ? tMap.get(uidStr) : null,
      };
    });

    return {
      users: enrichedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 10. 360-DEGREE USER DOSSIER
   */
  async getUser360(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid User ID provided.', 400);
    }
    const user = await User.findById(userId).select('-passwordHash').lean();
    if (!user) {
      throw new AppError('User account not found.', 404);
    }

    const [
      studentProfile,
      teacherProfile,
      appointmentsAsStudent,
      teachingListings,
      learningGoals,
      skillConnections,
      createdEvents,
      documentsCount,
      auditLogs,
    ] = await Promise.all([
      user.role === 'STUDENT' ? StudentProfile.findOne({ user: user._id }).lean() : null,
      user.role === 'TEACHER' ? TeacherProfile.findOne({ user: user._id }).lean() : null,
      Appointment.find({ student: user._id }).sort({ createdAt: -1 }).limit(10).lean(),
      TeachingListingModel.find({ user: user._id }).sort({ createdAt: -1 }).lean(),
      LearningGoalModel.find({ user: user._id }).sort({ createdAt: -1 }).lean(),
      SkillConnectionModel.find({ $or: [{ requester: user._id }, { receiver: user._id }] }).sort({ createdAt: -1 }).lean(),
      CampusEvent.find({ createdBy: user._id }).sort({ createdAt: -1 }).lean(),
      DocumentModel.countDocuments({ owner: user._id }),
      AdminAuditLog.find({ targetUser: user._id }).sort({ createdAt: -1 }).limit(15).populate('adminUser', 'fullName email role').lean(),
    ]);

    let teacherAppointments: any[] = [];
    if (teacherProfile) {
      teacherAppointments = await Appointment.find({ teacherProfile: teacherProfile._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('student', 'fullName email uid')
        .lean();
    }

    return {
      user,
      profile: studentProfile || teacherProfile,
      appointments: user.role === 'STUDENT' ? appointmentsAsStudent : teacherAppointments,
      learnTeach: {
        listings: teachingListings,
        goals: learningGoals,
        connections: skillConnections,
      },
      events: createdEvents,
      aiTutor: {
        documentsCount,
      },
      auditHistory: auditLogs,
    };
  }

  /**
   * 11. UNIVERSAL USER STATUS UPDATE (SUSPENSION / REACTIVATION)
   */
  async updateUniversalUserStatus(
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED',
    reason: string | undefined,
    adminId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID format.', 400);
    }
    if (userId === adminId && status !== 'ACTIVE') {
      throw new AppError('Security constraint: You cannot suspend or deactivate your own administrator account.', 400);
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new AppError('User not found.', 404);
    }

    if (targetUser.role === 'ADMIN' && status !== 'ACTIVE') {
      const activeAdmins = await User.countDocuments({ role: 'ADMIN', accountStatus: 'ACTIVE' });
      if (activeAdmins <= 1) {
        throw new AppError('Security constraint: Cannot suspend or deactivate the final active platform administrator.', 400);
      }
    }

    if (status === 'SUSPENDED' && (!reason || reason.trim().length < 5)) {
      throw new AppError('A valid suspension reason of at least 5 characters is mandatory.', 400);
    }

    const previousStatus = targetUser.accountStatus;
    targetUser.accountStatus = status;
    if (status === 'SUSPENDED') {
      targetUser.suspensionReason = reason?.trim();
      targetUser.suspendedAt = new Date();
      targetUser.suspendedBy = new Types.ObjectId(adminId);
    } else if (status === 'ACTIVE') {
      targetUser.suspensionReason = undefined;
      targetUser.suspendedAt = undefined;
      targetUser.suspendedBy = undefined;
    }

    await targetUser.save();

    await auditService.logAdminAction({
      adminId,
      action: status === 'ACTIVE' ? 'USER_REACTIVATED' : 'USER_SUSPENDED',
      targetUserId: targetUser._id,
      entityType: 'USER',
      reason: reason?.trim() || `User status updated to ${status}`,
      metadata: { previousStatus, newStatus: status },
      ipAddress,
    });

    await notificationService.createNotification({
      recipient: targetUser._id,
      type: 'ACCOUNT_SUSPENDED',
      title: status === 'ACTIVE' ? 'Account Reactivated' : 'Account Suspended',
      message:
        status === 'ACTIVE'
          ? 'Your CUCampusSaathi account has been reactivated. You have regained full access to university platform tools.'
          : `Your CUCampusSaathi account has been suspended by administration. Reason: ${reason || 'Violation of campus collaboration terms.'}`,
    });

    return targetUser;
  }

  /**
   * 12. UPDATE ADMIN NOTES
   */
  async updateUserAdminNotes(userId: string, notes: string, adminId: string, ipAddress?: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid User ID.', 400);
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    user.adminNotes = notes?.trim() || '';
    await user.save();

    await auditService.logAdminAction({
      adminId,
      action: 'SETTINGS_UPDATED',
      targetUserId: user._id,
      entityType: 'USER',
      reason: 'Admin internal notes updated.',
      ipAddress,
    });

    return user;
  }

  /**
   * 13. ATTENDANCE & NO-SHOW MANAGEMENT
   */
  async getAttendanceAndAppeals(query: {
    page?: number;
    limit?: number;
    status?: string;
    hasAppeal?: boolean;
    search?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.status && query.status !== 'ALL') {
      filter.attendanceStatus = query.status;
    } else if (query.hasAppeal) {
      filter['noShowAppeal.status'] = { $in: ['PENDING', 'APPROVED', 'REJECTED'] };
    } else {
      filter.$or = [
        { attendanceStatus: { $in: ['ATTENDED', 'NO_SHOW'] } },
        { 'noShowAppeal.status': { $exists: true } },
      ];
    }

    const [appointments, total, totalNoShows, pendingAppeals] = await Promise.all([
      Appointment.find(filter)
        .populate('student', 'fullName email uid department')
        .populate({
          path: 'teacherProfile',
          populate: { path: 'user', select: 'fullName email uid department' },
        })
        .populate('slot')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(filter),
      Appointment.countDocuments({ attendanceStatus: 'NO_SHOW' }),
      Appointment.countDocuments({ 'noShowAppeal.status': 'PENDING' }),
    ]);

    return {
      appointments,
      metrics: {
        totalAttendanceMarked: total,
        totalNoShows,
        pendingAppeals,
      },
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 14. REVIEW NO-SHOW APPEAL
   */
  async reviewAppointmentAppeal(
    appointmentId: string,
    decision: 'APPROVE' | 'REJECT',
    adminNotes: string,
    adminId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw new AppError('Invalid appointment ID.', 400);
    }
    const appointment = await Appointment.findById(appointmentId).populate('student', 'fullName email');
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }
    if (!appointment.noShowAppeal || appointment.noShowAppeal.status !== 'PENDING') {
      throw new AppError('No pending student appeal found for this consultation.', 400);
    }

    appointment.noShowAppeal.status = decision === 'APPROVE' ? 'RESOLVED' : 'REJECTED';
    appointment.noShowAppeal.resolvedAt = new Date();
    appointment.noShowAppeal.resolvedBy = new Types.ObjectId(adminId);
    appointment.noShowAppeal.adminReviewNotes = adminNotes?.trim() || `Administrative decision: ${decision}.`;

    if (decision === 'APPROVE') {
      appointment.attendanceStatus = 'ATTENDED';
    }

    await appointment.save();

    await auditService.logAdminAction({
      adminId,
      action: decision === 'APPROVE' ? 'APPEAL_APPROVED' : 'APPEAL_REJECTED',
      targetAppointmentId: appointment._id,
      entityType: 'APPOINTMENT',
      reason: adminNotes?.trim() || `Admin reviewed student no-show appeal with verdict: ${decision}`,
      metadata: { decision, appointmentId },
      ipAddress,
    });

    if (appointment.student) {
      await notificationService.createNotification({
        recipient: (appointment.student as any)._id || appointment.student,
        type: 'APPOINTMENT_COMPLETED',
        title: `No-Show Appeal ${decision === 'APPROVE' ? 'Approved' : 'Declined'}`,
        message:
          decision === 'APPROVE'
            ? 'Your consultation no-show appeal was approved by administration. Attendance record adjusted.'
            : `Your no-show appeal was declined by administration. Notes: ${adminNotes || 'Insufficient medical/academic documentation.'}`,
      });
    }

    return appointment;
  }

  /**
   * 15. LEARN & TEACH NETWORK ADMINISTRATION
   */
  async listLearnTeachAdministration(query: {
    tab?: 'listings' | 'groups' | 'reports';
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const tab = query.tab || 'listings';
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    if (tab === 'listings') {
      const filter: Record<string, any> = {};
      if (query.search && query.search.trim()) {
        filter.$or = [
          { 'skill.name': { $regex: query.search.trim(), $options: 'i' } },
          { description: { $regex: query.search.trim(), $options: 'i' } },
        ];
      }
      const [listings, total] = await Promise.all([
        TeachingListingModel.find(filter)
          .populate('user', 'fullName email uid department role')
          .populate('skill')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        TeachingListingModel.countDocuments(filter),
      ]);
      return { listings, total, page, totalPages: Math.ceil(total / limit) || 1 };
    } else if (tab === 'groups') {
      const filter: Record<string, any> = {};
      if (query.search && query.search.trim()) {
        filter.name = { $regex: query.search.trim(), $options: 'i' };
      }
      const [groups, total] = await Promise.all([
        LearningGroupModel.find(filter)
          .populate('createdBy', 'fullName email uid department')
          .populate('skill')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        LearningGroupModel.countDocuments(filter),
      ]);
      return { groups, total, page, totalPages: Math.ceil(total / limit) || 1 };
    } else {
      const filter: Record<string, any> = {};
      const [reports, total] = await Promise.all([
        LearnTeachReportModel.find(filter)
          .populate('reporter', 'fullName email uid role')
          .populate('reportedUser', 'fullName email uid role')
          .populate('reviewedBy', 'fullName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        LearnTeachReportModel.countDocuments(filter),
      ]);
      return { reports, total, page, totalPages: Math.ceil(total / limit) || 1 };
    }
  }

  async moderateTeachingListing(
    listingId: string,
    action: 'HIDE' | 'RESTORE',
    reason: string,
    adminId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(listingId)) {
      throw new AppError('Invalid listing ID.', 400);
    }
    const listing = await TeachingListingModel.findById(listingId);
    if (!listing) {
      throw new AppError('Teaching listing not found.', 404);
    }

    listing.status = action === 'HIDE' ? 'PAUSED' : 'ACTIVE';
    await listing.save();

    await auditService.logAdminAction({
      adminId,
      action: action === 'HIDE' ? 'LISTING_HIDDEN' : 'LISTING_RESTORED',
      entityType: 'LEARN_TEACH',
      reason: reason?.trim() || `Listing status updated to ${listing.status}`,
      metadata: { listingId, action },
      ipAddress,
    });

    return listing;
  }

  async resolveLearnTeachReport(
    reportId: string,
    action: 'RESOLVE' | 'DISMISS',
    resolutionNotes: string,
    adminId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new AppError('Invalid report ID.', 400);
    }
    const report = await LearnTeachReportModel.findById(reportId);
    if (!report) {
      throw new AppError('Report not found.', 404);
    }

    report.status = action === 'RESOLVE' ? 'ACTION_TAKEN' : 'DISMISSED';
    report.reviewedBy = new Types.ObjectId(adminId);
    report.adminNotes = resolutionNotes?.trim() || `Report marked ${action}.`;
    await report.save();

    await auditService.logAdminAction({
      adminId,
      action: action === 'RESOLVE' ? 'REPORT_RESOLVED' : 'REPORT_DISMISSED',
      entityType: 'REPORT',
      reason: resolutionNotes?.trim(),
      metadata: { reportId, action },
      ipAddress,
    });

    return report;
  }

  /**
   * 16. CAMPUS EVENTS MODERATION
   */
  async listCampusEvents(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.search && query.search.trim()) {
      filter.$or = [
        { title: { $regex: query.search.trim(), $options: 'i' } },
        { organizerName: { $regex: query.search.trim(), $options: 'i' } },
      ];
    }

    const [events, total] = await Promise.all([
      CampusEvent.find(filter)
        .populate('createdBy', 'fullName email role department')
        .sort({ startDateTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CampusEvent.countDocuments(filter),
    ]);

    return { events, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  async moderateCampusEvent(
    eventId: string,
    action: 'UNPUBLISH' | 'RESTORE',
    reason: string,
    adminId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new AppError('Invalid event ID.', 400);
    }
    const event = await CampusEvent.findById(eventId);
    if (!event) {
      throw new AppError('Event not found.', 404);
    }

    event.status = action === 'UNPUBLISH' ? 'CANCELLED' : 'PUBLISHED';
    if (action === 'UNPUBLISH') {
      event.cancelledAt = new Date();
      event.cancellationReason = reason?.trim() || 'Event unpublished by administration.';
    } else {
      event.cancelledAt = undefined;
      event.cancellationReason = undefined;
    }
    await event.save();

    await auditService.logAdminAction({
      adminId,
      action: action === 'UNPUBLISH' ? 'EVENT_UNPUBLISHED' : 'EVENT_RESTORED',
      entityType: 'EVENT',
      reason: reason?.trim(),
      metadata: { eventId, action },
      ipAddress,
    });

    return event;
  }

  /**
   * 17. CONTACT MESSAGES LIFECYCLE
   */
  async listContactMessages(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.search && query.search.trim()) {
      filter.$or = [
        { fullName: { $regex: query.search.trim(), $options: 'i' } },
        { email: { $regex: query.search.trim(), $options: 'i' } },
        { subject: { $regex: query.search.trim(), $options: 'i' } },
      ];
    }

    const [messages, total, pendingCount] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ContactMessage.countDocuments(filter),
      ContactMessage.countDocuments({ status: 'NEW' }),
    ]);

    return { messages, total, pendingCount, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  async updateContactMessage(
    messageId: string,
    status: 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'ARCHIVED',
    adminNotes: string,
    adminId: string,
    ipAddress?: string
  ) {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new AppError('Invalid message ID.', 400);
    }
    const message = await ContactMessage.findById(messageId);
    if (!message) {
      throw new AppError('Contact message not found.', 404);
    }

    message.status = status;
    await message.save();

    await auditService.logAdminAction({
      adminId,
      action: 'CONTACT_STATUS_UPDATED',
      entityType: 'CONTACT',
      reason: `Message status updated to ${status}. ${adminNotes || ''}`,
      metadata: { messageId, status },
      ipAddress,
    });

    return message;
  }

  /**
   * 18. PLATFORM SETTINGS
   */
  async getPlatformSettings() {
    let settings: any = await PlatformSetting.findOne().populate('updatedBy', 'fullName email role').lean();
    if (!settings) {
      const created = await PlatformSetting.create({
        platformName: 'CUCampusSaathi',
        supportEmail: 'support@cuchd.in',
        supportPhone: '+91 160 3051000',
        allowStudentRegistration: true,
        allowTeacherRegistration: true,
        maintenanceMode: false,
        maintenanceMessage: 'CUCampusSaathi is currently undergoing scheduled platform maintenance. Please check back shortly.',
        announcementBanner: { enabled: false, message: '', type: 'INFO' },
      });
      settings = created.toObject();
    }
    return settings;
  }

  async updatePlatformSettings(
    data: {
      platformName?: string;
      supportEmail?: string;
      supportPhone?: string;
      allowStudentRegistration?: boolean;
      allowTeacherRegistration?: boolean;
      maintenanceMode?: boolean;
      maintenanceMessage?: string;
      announcementBanner?: { enabled: boolean; message: string; type: 'INFO' | 'WARNING' | 'ALERT' };
    },
    adminId: string,
    ipAddress?: string
  ) {
    let settings = await PlatformSetting.findOne();
    if (!settings) {
      settings = new PlatformSetting();
    }

    if (data.platformName !== undefined) settings.platformName = data.platformName.trim();
    if (data.supportEmail !== undefined) settings.supportEmail = data.supportEmail.trim();
    if (data.supportPhone !== undefined) settings.supportPhone = data.supportPhone.trim();
    if (data.allowStudentRegistration !== undefined) settings.allowStudentRegistration = data.allowStudentRegistration;
    if (data.allowTeacherRegistration !== undefined) settings.allowTeacherRegistration = data.allowTeacherRegistration;
    if (data.maintenanceMode !== undefined) settings.maintenanceMode = data.maintenanceMode;
    if (data.maintenanceMessage !== undefined) settings.maintenanceMessage = data.maintenanceMessage.trim();
    if (data.announcementBanner !== undefined) settings.announcementBanner = data.announcementBanner;

    settings.updatedBy = new Types.ObjectId(adminId);
    await settings.save();

    await auditService.logAdminAction({
      adminId,
      action: 'SETTINGS_UPDATED',
      entityType: 'SYSTEM',
      reason: 'Platform operational configuration updated.',
      metadata: data,
      ipAddress,
    });

    return settings;
  }

  /**
   * 19. GLOBAL CATEGORIZED SEARCH
   */
  async globalSearch(searchTerm: string) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { users: [], appointments: [], events: [], listings: [], groups: [], messages: [] };
    }
    const q = searchTerm.trim();
    const regex = { $regex: q, $options: 'i' };

    const [users, appointments, events, listings, groups, messages] = await Promise.all([
      User.find({
        $or: [{ fullName: regex }, { email: regex }, { uid: regex }, { department: regex }],
      })
        .select('fullName email uid role department accountStatus')
        .limit(6)
        .lean(),
      Appointment.find({ agenda: regex })
        .populate('student', 'fullName email')
        .select('agenda status meetingMode student createdAt')
        .limit(5)
        .lean(),
      CampusEvent.find({ $or: [{ title: regex }, { organizerName: regex }] })
        .select('title category mode startDateTime status venue')
        .limit(5)
        .lean(),
      TeachingListingModel.find({ $or: [{ 'skill.name': regex }, { description: regex }] })
        .populate('user', 'fullName email role')
        .populate('skill')
        .limit(5)
        .lean(),
      LearningGroupModel.find({ name: regex }).select('name membersCount isPrivate').limit(5)
        .lean(),
      ContactMessage.find({ $or: [{ fullName: regex }, { subject: regex }, { email: regex }] })
        .select('fullName email subject status createdAt')
        .limit(5)
        .lean(),
    ]);

    return {
      users,
      appointments,
      events,
      listings,
      groups,
      messages,
    };
  }

}

export const adminService = new AdminService();
