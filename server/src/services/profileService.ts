import { StudentProfile, IStudentProfile } from '../models/StudentProfile';
import { TeacherProfile, ITeacherProfile } from '../models/TeacherProfile';
import { User, IUser } from '../models/User';
import { StudentProfileInput, TeacherProfileInput } from '../utils/validators';
import { AppError } from '../utils/errors';

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  uid: string;
  role: string;
  department: string;
  isVerified: boolean;
}

function toSafeUser(user: IUser): SafeUser {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    uid: user.uid,
    role: user.role,
    department: user.department,
    isVerified: user.isVerified,
  };
}

export class ProfileService {
  /**
   * Retrieve the student profile for an authenticated student.
   */
  async getStudentProfile(userId: string): Promise<{
    profile: IStudentProfile | null;
    user: SafeUser;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User account not found', 404);
    }

    const profile = await StudentProfile.findOne({ user: userId });
    return {
      profile,
      user: toSafeUser(user),
    };
  }

  /**
   * Upsert (create or update) the student profile for the authenticated student.
   * Guarantees that protected User fields cannot be modified through this endpoint.
   */
  async upsertStudentProfile(
    userId: string,
    data: StudentProfileInput
  ): Promise<{
    profile: IStudentProfile;
    user: SafeUser;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User account not found', 404);
    }

    if (user.role !== 'STUDENT') {
      throw new AppError('Only students can create or update a student profile', 403);
    }

    const existing = await StudentProfile.findOne({ user: userId });
    const isAlreadyCompleted = existing?.isOnboardingCompleted === true;

    const hasBasicInfo = Boolean(
      (data.course || '').trim() ||
      (data.bio || '').trim() ||
      (Array.isArray(data.skills) && data.skills.length > 0) ||
      (data.personalEmail || '').trim()
    );

    const isOnboardingCompleted =
      data.isOnboardingCompleted === true ||
      isAlreadyCompleted ||
      hasBasicInfo;

    const profile = await StudentProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          user: user._id,
          course: data.course,
          semester: data.semester,
          bio: data.bio || '',
          skills: data.skills || [],
          personalEmail: data.personalEmail || '',
          contactNumber: data.contactNumber || '',
          isOnboardingCompleted,
          socialLinks: data.socialLinks || {},
          privacyLevel: data.privacyLevel || 'CAMPUS_ONLY',
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return {
      profile,
      user: toSafeUser(user),
    };
  }

  /**
   * Retrieve the teacher profile for an authenticated teacher.
   */
  async getTeacherProfile(userId: string): Promise<{
    profile: ITeacherProfile | null;
    user: SafeUser;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User account not found', 404);
    }

    const profile = await TeacherProfile.findOne({ user: userId });
    return {
      profile,
      user: toSafeUser(user),
    };
  }

  /**
   * Upsert (create or update) the teacher profile for the authenticated teacher.
   * Guarantees that protected User fields cannot be modified through this endpoint.
   */
  async upsertTeacherProfile(
    userId: string,
    data: TeacherProfileInput
  ): Promise<{
    profile: ITeacherProfile;
    user: SafeUser;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User account not found', 404);
    }

    if (user.role !== 'TEACHER') {
      throw new AppError('Only faculty/teachers can create or update a teacher profile', 403);
    }

    const profile = await TeacherProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          user: user._id,
          designation: data.designation,
          department: data.department,
          researchDomains: data.researchDomains || [],
          officeLocation: data.officeLocation,
          bookingPreference: data.bookingPreference || 'WEEKLY_OFFICE_HOURS',
          maxDailySlots: data.maxDailySlots,
          isAcceptingBookings: data.isAcceptingBookings,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return {
      profile,
      user: toSafeUser(user),
    };
  }

  /**
   * Update teacher's live cabin availability status (e.g. IN_CABIN, IN_LECTURE, BUSY, AWAY).
   */
  async updateCabinStatus(
    userId: string,
    status: 'IN_CABIN' | 'IN_LECTURE' | 'BUSY' | 'AWAY',
    note?: string
  ): Promise<ITeacherProfile> {
    const validStatuses = ['IN_CABIN', 'IN_LECTURE', 'BUSY', 'AWAY'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid cabin status. Must be IN_CABIN, IN_LECTURE, BUSY, or AWAY.', 400);
    }

    const profile = await TeacherProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          cabinLiveStatus: status,
          cabinStatusNote: (note || '').trim().slice(0, 120),
          cabinStatusUpdatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!profile) {
      throw new AppError('Teacher profile not found. Please initialize your profile first.', 404);
    }

    return profile;
  }
}

export const profileService = new ProfileService();
