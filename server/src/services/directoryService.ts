import { FilterQuery, Types } from 'mongoose';
import { StudentProfile, IStudentProfile } from '../models/StudentProfile';
import { TeacherProfile, ITeacherProfile } from '../models/TeacherProfile';
import { User } from '../models/User';
import { DirectoryQueryInput } from '../utils/validators';

export interface DirectoryItem {
  id: string;
  profileId: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER';
  department: string;
  // Student specific
  course?: string;
  semester?: number;
  bio?: string;
  skills?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  privacyLevel?: string;
  // Teacher specific
  designation?: string;
  researchDomains?: string[];
  officeLocation?: string;
  cabinLiveStatus?: string;
  cabinStatusNote?: string;
  cabinStatusUpdatedAt?: Date;
  bookingPreference?: string;
  maxDailySlots?: number;
  isAcceptingBookings?: boolean;
}

export interface DirectoryResponse {
  items: DirectoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  viewer: {
    isCampusUser: boolean;
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class DirectoryService {
  /**
   * Search campus directory with privacy-aware filtering and pagination.
   */
  async searchDirectory(
    query: DirectoryQueryInput,
    isCampusUser: boolean
  ): Promise<DirectoryResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 12));
    const skip = (page - 1) * limit;

    const type = query.type || 'all';
    const q = query.q?.trim();
    const skillsFilter = query.skills?.trim();
    const departmentFilter = query.department?.trim();
    const courseFilter = query.course?.trim();
    const semesterFilter = query.semester;
    const researchDomainFilter = query.researchDomain?.trim();

    // 1. Resolve matching users by fullName or department if provided
    let matchingUserIds: Types.ObjectId[] | null = null;
    if (q || departmentFilter) {
      const userMatchQuery: FilterQuery<any> = {};
      if (q) {
        userMatchQuery.fullName = { $regex: escapeRegex(q), $options: 'i' };
      }
      if (departmentFilter) {
        userMatchQuery.department = { $regex: escapeRegex(departmentFilter), $options: 'i' };
      }
      const matched = await User.find(userMatchQuery).select('_id');
      matchingUserIds = matched.map((u) => u._id as Types.ObjectId);
    }

    // 2. Build Student Query
    const studentQuery: FilterQuery<IStudentProfile> = {};

    // Privacy filter:
    // CAMPUS_ONLY is only visible to authenticated campus users.
    // PRIVATE is NEVER visible in the directory.
    if (isCampusUser) {
      studentQuery.privacyLevel = { $in: ['PUBLIC', 'CAMPUS_ONLY'] };
    } else {
      studentQuery.privacyLevel = 'PUBLIC';
    }

    if (courseFilter) {
      studentQuery.course = { $regex: escapeRegex(courseFilter), $options: 'i' };
    }

    if (semesterFilter !== undefined && semesterFilter !== null) {
      studentQuery.semester = semesterFilter;
    }

    const andConditions: any[] = [];

    if (skillsFilter) {
      const skillTokens = skillsFilter
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillTokens.length === 1) {
        andConditions.push({
          skills: { $regex: new RegExp(escapeRegex(skillTokens[0]), 'i') },
        });
      } else if (skillTokens.length > 1) {
        andConditions.push({
          $or: skillTokens.map((s) => ({
            skills: { $regex: new RegExp(escapeRegex(s), 'i') },
          })),
        });
      }
    }

    if (q) {
      const qConditions: any[] = [
        { skills: { $regex: escapeRegex(q), $options: 'i' } },
        { course: { $regex: escapeRegex(q), $options: 'i' } },
        { bio: { $regex: escapeRegex(q), $options: 'i' } },
      ];
      if (matchingUserIds && matchingUserIds.length > 0) {
        qConditions.push({ user: { $in: matchingUserIds } });
      }
      andConditions.push({ $or: qConditions });
    } else if (departmentFilter && matchingUserIds) {
      studentQuery.user = { $in: matchingUserIds };
    }

    if (andConditions.length > 0) {
      studentQuery.$and = andConditions;
    }

    // 3. Build Teacher Query
    const teacherQuery: FilterQuery<ITeacherProfile> = {};
    const teacherAndConditions: any[] = [];

    if (departmentFilter) {
      teacherQuery.department = { $regex: escapeRegex(departmentFilter), $options: 'i' };
    }

    if (researchDomainFilter) {
      teacherAndConditions.push({
        researchDomains: {
          $regex: escapeRegex(researchDomainFilter),
          $options: 'i',
        },
      });
    }

    if (q) {
      const teacherQConditions: any[] = [
        { designation: { $regex: escapeRegex(q), $options: 'i' } },
        { department: { $regex: escapeRegex(q), $options: 'i' } },
        { researchDomains: { $regex: escapeRegex(q), $options: 'i' } },
        { officeLocation: { $regex: escapeRegex(q), $options: 'i' } },
      ];
      if (matchingUserIds && matchingUserIds.length > 0) {
        teacherQConditions.push({ user: { $in: matchingUserIds } });
      }
      teacherAndConditions.push({ $or: teacherQConditions });
    }

    if (teacherAndConditions.length > 0) {
      teacherQuery.$and = teacherAndConditions;
    }

    // 4. Execute queries based on requested type
    let items: DirectoryItem[] = [];
    let total = 0;

    if (type === 'student') {
      total = await StudentProfile.countDocuments(studentQuery);
      const studentProfiles = await StudentProfile.find(studentQuery)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'fullName department email role uid');

      items = studentProfiles
        .filter((sp) => sp.user != null)
        .map((sp) => {
          const userDoc = sp.user as any;
          return {
            id: userDoc._id.toString(),
            profileId: sp._id.toString(),
            fullName: userDoc.fullName,
            role: 'STUDENT',
            department: userDoc.department || 'General',
            course: sp.course,
            semester: sp.semester,
            bio: sp.bio || '',
            skills: sp.skills || [],
            socialLinks:
              isCampusUser || sp.privacyLevel === 'PUBLIC' ? sp.socialLinks : {},
            privacyLevel: sp.privacyLevel,
          };
        });
    } else if (type === 'teacher') {
      total = await TeacherProfile.countDocuments(teacherQuery);
      const teacherProfiles = await TeacherProfile.find(teacherQuery)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'fullName department email role uid');

      items = teacherProfiles
        .filter((tp) => tp.user != null)
        .map((tp) => {
          const userDoc = tp.user as any;
          return {
            id: userDoc._id.toString(),
            profileId: tp._id.toString(),
            fullName: userDoc.fullName,
            role: 'TEACHER',
            department: tp.department || userDoc.department || 'Academics',
            designation: tp.designation,
            researchDomains: tp.researchDomains || [],
            officeLocation: tp.officeLocation,
            cabinLiveStatus: tp.cabinLiveStatus || 'IN_CABIN',
            cabinStatusNote: tp.cabinStatusNote || '',
            cabinStatusUpdatedAt: tp.cabinStatusUpdatedAt,
            bookingPreference: tp.bookingPreference,
            maxDailySlots: tp.maxDailySlots,
            isAcceptingBookings: tp.isAcceptingBookings,
          };
        });
    } else {
      // type === 'all'
      const [studentCount, teacherCount] = await Promise.all([
        StudentProfile.countDocuments(studentQuery),
        TeacherProfile.countDocuments(teacherQuery),
      ]);
      total = studentCount + teacherCount;

      const [studentProfiles, teacherProfiles] = await Promise.all([
        StudentProfile.find(studentQuery)
          .sort({ updatedAt: -1 })
          .limit(limit * 2)
          .populate('user', 'fullName department email role uid'),
        TeacherProfile.find(teacherQuery)
          .sort({ updatedAt: -1 })
          .limit(limit * 2)
          .populate('user', 'fullName department email role uid'),
      ]);

      const formattedStudents: DirectoryItem[] = studentProfiles
        .filter((sp) => sp.user != null)
        .map((sp) => {
          const userDoc = sp.user as any;
          return {
            id: userDoc._id.toString(),
            profileId: sp._id.toString(),
            fullName: userDoc.fullName,
            role: 'STUDENT' as const,
            department: userDoc.department || 'General',
            course: sp.course,
            semester: sp.semester,
            bio: sp.bio || '',
            skills: sp.skills || [],
            socialLinks:
              isCampusUser || sp.privacyLevel === 'PUBLIC' ? sp.socialLinks : {},
            privacyLevel: sp.privacyLevel,
          };
        });

      const formattedTeachers: DirectoryItem[] = teacherProfiles
        .filter((tp) => tp.user != null)
        .map((tp) => {
          const userDoc = tp.user as any;
          return {
            id: userDoc._id.toString(),
            profileId: tp._id.toString(),
            fullName: userDoc.fullName,
            role: 'TEACHER' as const,
            department: tp.department || userDoc.department || 'Academics',
            designation: tp.designation,
            researchDomains: tp.researchDomains || [],
            officeLocation: tp.officeLocation,
            cabinLiveStatus: tp.cabinLiveStatus || 'IN_CABIN',
            cabinStatusNote: tp.cabinStatusNote || '',
            cabinStatusUpdatedAt: tp.cabinStatusUpdatedAt,
            bookingPreference: tp.bookingPreference,
            maxDailySlots: tp.maxDailySlots,
            isAcceptingBookings: tp.isAcceptingBookings,
          };
        });

      // Interleave/combine results and paginate
      const combined = [...formattedStudents, ...formattedTeachers];
      items = combined.slice(skip, skip + limit);
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      viewer: {
        isCampusUser,
      },
    };
  }
}

export const directoryService = new DirectoryService();
